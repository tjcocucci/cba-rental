import time
from geopy.geocoders import Nominatim

class GeoLocator:
    def __init__(self):
        self.geolocator = Nominatim(user_agent="cba-rental-scraper")
        self.viewbox = ((-31.313631, -64.320448), (-31.495774, -64.071314))

    def get_coordinates(self, location_string):
        """
        Given an address, return a dictionary with the latitude and longitude of the address.
        """
        try:
            location = self.geolocator.geocode(
                location_string,
                viewbox=((-31.313631, -64.320448), (-31.495774, -64.071314)),
                bounded=True,
                timeout=5,
            )
            latitude = location.latitude if location else None
            longitude = location.longitude if location else None
            print(f"Location: {location}")

        except Exception as e:
            print(f"Error geolocating: {e}")
            latitude = None
            longitude = None

        time.sleep(2)
        return {"latitude": latitude, "longitude": longitude}

