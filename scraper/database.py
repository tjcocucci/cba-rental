from pymongo import MongoClient

from pymongo.errors import ConnectionFailure
client = MongoClient()

class DataBaseClient:
    def __init__(self, url):
        self.client = MongoClient(url)
        try:
            client.admin.command('ping')
        except ConnectionFailure:
            print("Server not available")

        print(self.client.list_database_names(), )
        self.db = self.client["cba_rent"]
        self.collection = self.db["properties"]
