from scraper.scraper import Scraper

def main():
    base_url = "https://www.zonaprop.com.ar/casas-departamentos-alquiler-cordoba-cb"

    scraper = Scraper(base_url)
    scraper.scrap_all_pages()

if __name__ == "__main__":
    main()
    