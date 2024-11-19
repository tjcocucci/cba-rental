import os
import sys
import re
import requests
import cloudscraper
import datetime
from bs4 import BeautifulSoup
from database import DataBaseClient
from geolocator import GeoLocator
from dotenv import dotenv_values


config = dotenv_values(".env")
user = config["MONGO_USERNAME"]
password = config["MONGO_PASSWORD"]
host = config["MONGO_HOST"]
port = config["MONGO_PORT"]

MONGO_URL = f"mongodb://{user}:{password}@{host}:{port}/"


DB_NAME = config["DB_NAME"]

PAGE_URL_SUFFIX = "-pagina-"
HTML_EXTENSION = ".html"

EXCHANGE_RATE_API_URL = "https://dolarapi.com/v1/dolares/blue"

PAGES_HARD_LIMIT = 200

FEATURE_UNIT_DICT = {
    "m²": "square_meters_area",
    "amb": "rooms",
    "dorm": "bedrooms",
    "baño": "bathrooms",
    "coch": "parking",
}

MATCHER_DICT = {
    "rental": "div[data-qa='POSTING_CARD_PRICE']",
    "expenses": "div[data-qa='expensas']",
    "address": "div[class*='LocationAddress']",
    "location": "h2[data-qa='POSTING_CARD_LOCATION']",
    "features": "h3[data-qa='POSTING_CARD_FEATURES']",
    "main_div": "div[data-qa='posting PROPERTY']",
}

CURRENCY_DICT = {
    "$": "ARS",
    "USD": "USD",
}

DATA_COLUMNS = [
    "zp_id",
    "scraped_at",
    "rental_price_original",
    "rental_currency_original",
    "rental_price_usd_normalized",
    "expenses_price_original",
    "expenses_currency_original",
    "expenses_price_usd_normalized",
    "usd_buy_price",
    "address",
    "location",
    "square_meters_area",
    "rooms",
    "bedrooms",
    "bathrooms",
    "parking",
    "latitude",
    "longitude",
]


class Scraper:
    def __init__(self, base_url):
        self.base_url = base_url
        self.data_filename = f"data_csvs/{datetime.datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}_data.csv"
        self.db_client = DataBaseClient(MONGO_URL, DB_NAME)
        self.geolocator = GeoLocator()
        if not os.path.exists("data_csvs"):
            os.makedirs("data_csvs")
        with open(self.data_filename, "w+") as file:
            file.write(",".join(DATA_COLUMNS) + "\n")
        try:
            self.current_usd_to_ars_exchange_rate = self.get_usd_to_ars_exchange_rate()
        except Exception as e:
            print(f"Error getting exchange rate: {e}")
            sys.exit(1)

    def scrap_all_pages(self):
        """
        Scrap all the pages of the website until there are no more pages with new data.
        """
        page_number = 1
        previous_posts = []

        while page_number < PAGES_HARD_LIMIT:
            page_url = self.build_page_url(page_number)
            print(f"URL: {page_url}")

            scraper = cloudscraper.create_scraper()
            page_content = scraper.get(page_url).content
            soup = BeautifulSoup(page_content, "html.parser")
            properties_posts = soup.select(MATCHER_DICT["main_div"])

            if previous_posts == properties_posts:
                print("No more new pages to scrape. Stopping.")
                break

            for post in properties_posts:
                poperty_data = self.get_property_data_from_post(post)
                if poperty_data:
                    self.save_data_row_to_csv(poperty_data)
                    self.upsert_property(poperty_data)

            previous_posts = properties_posts
            page_number += 1

    def build_page_url(self, page_number):
        return (
            f"{self.base_url}{HTML_EXTENSION}"
            if page_number == 1
            else f"{self.base_url}{PAGE_URL_SUFFIX}{page_number}{HTML_EXTENSION}"
        )

    def save_data_row_to_csv(self, data):
        """
        Given a dictionary with the data of a property, save it to the data file.
        """
        with open(self.data_filename, "a") as file:
            ordered_data = [data.get(column, "") for column in DATA_COLUMNS]
            data_row = ",".join([str(value) for value in ordered_data])
            file.write(data_row + "\n")

    def is_zp_id_in_db(self, zp_id):
        """
        Check if the zp_id is already in the MongoDB database.
        """
        return self.db_client.collection.find_one({"zp_id": zp_id}) is not None

    def get_property_data_from_post(self, post):
        data = {}
        data["scraped_at"] = datetime.datetime.now()
        data["zp_id"] = self.get_zp_id(post)
        if self.is_zp_id_in_db(data["zp_id"]):
            return None

        data |= self.get_price(post, "rental")
        data |= self.get_price(post, "expenses")
        data["address"] = self.extract_text(post, "address")
        data["location"] = self.extract_text(post, "location")
        data |= self.get_features(post)
        data |= self.geolocator.get_coordinates(
            data["address"] + " " + data["location"]
        )
        return data

    def get_zp_id(self, post):
        """
        Given a post, return the ZP ID of the property.
        """
        return post.get("data-id")

    def upsert_property(self, property_data):
        """
        Given a dictionary with the data of a property, insert it into the MongoDB database.
        If the property is already in the database, update it.
        """
        zp_id = property_data["zp_id"]
        self.db_client.collection.update_one(
            {"zp_id": zp_id}, {"$set": property_data}, upsert=True
        )

    def extract_first_element(self, post, label):
        """
        Given a post and a label, return the first element in the post that matches the label.
        """
        elements = post.select(MATCHER_DICT[label])
        if len(elements) == 0:
            return None
        return elements[0]

    def extract_text(self, post, label):
        """
        Given a post and a label, return the text of the first element in the post that matches the label.
        """
        element = self.extract_first_element(post, label)
        if element:
            return element.text
        else:
            return ""

    def extract_spans_text(self, post, label):
        """
        Given a post and a label, return a list with all the spans in the post that matches the label.
        """
        element = self.extract_first_element(post, label)
        if element:
            spans = element.select("span")
            return spans
        else:
            return []

    def get_price(self, post, label):
        """
        Given a post, return a dictionary with the price and currency of the property.
        """
        price_text = self.extract_text(post, label)
        price, currency = self.get_quantity_and_currency(price_text)
        usd_normalized_price = (
            price
            if currency == "USD"
            else price / self.current_usd_to_ars_exchange_rate
        )
        return {
            f"{label}_price_original": price,
            f"{label}_currency_original": currency,
            f"{label}_price_usd_normalized": usd_normalized_price,
        }

    def get_quantity_and_currency(self, text):
        """
        Given a text, return a tuple with the quantity and the currency of the price.
        """
        currency = self.extract_currency(text)
        quantity = self.extract_quantity(text)
        return (quantity, currency)

    def get_features(self, post):
        """
        Given a post, return a dictionary with the features of the property.
        """
        spans = self.extract_spans_text(post, "features")
        features_dict = {}
        for span in spans:
            text = span.text
            category = self.get_feature_category(text)
            features_dict[category] = self.extract_quantity(text)
        return features_dict

    def get_feature_category(self, text):
        """
        Given a text, return the category of the feature. If the text does not contain any feature, return None.
        """
        for unit, category in FEATURE_UNIT_DICT.items():
            if unit in text:
                return category
        return None

    def extract_quantity(self, text):
        """
        Given a text, return all the digits in it as a single integer. If there are no digits, return 0.
        """
        regex = r"\d+"
        all_matches = re.findall(regex, text)
        try:
            value = int("".join(all_matches))
        except ValueError:
            value = 0
        return value

    def extract_currency(self, text):
        """
        Given a text, return the currency in which the price is expressed. If the currency is not found, return None.
        """
        for currency_symbol, currency in CURRENCY_DICT.items():
            if currency_symbol in text:
                return currency
        return None

    def get_usd_to_ars_exchange_rate(self):
        """
        Get the current exchange rate from USD to ARS.
        """
        response = requests.get(EXCHANGE_RATE_API_URL)
        data = response.json()
        return data["compra"]
