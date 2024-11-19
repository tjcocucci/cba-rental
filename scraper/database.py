from pymongo import MongoClient

from pymongo.errors import ConnectionFailure

client = MongoClient()


class DataBaseClient:
    def __init__(self, url, db_name):
        self.client = MongoClient(url)
        print(f"mongo_url: {url}")
        print(f"db_name: {db_name}")
        try:
            self.client.admin.command("ping")
        except ConnectionFailure:
            print("Server not available")
        self.db = self.client[db_name]
        self.collection = self.db["properties"]
        print(self.collection.find_one())
