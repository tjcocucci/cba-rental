from fastapi import FastAPI
from dotenv import dotenv_values
from pymongo import MongoClient
from routes import router as properties_router

config = dotenv_values(".env")
user = config["MONGO_USERNAME"]
password = config["MONGO_PASSWORD"]
host = config["MONGO_HOST"]
port = config["MONGO_PORT"]

MONGO_URL = f"mongodb://{user}:{password}@{host}:{port}/"


app = FastAPI()


@app.on_event("startup")
def startup_db_client():
    app.mongodb_client = MongoClient(MONGO_URL)
    app.database = app.mongodb_client[config["DB_NAME"]]
    print("Connected to the MongoDB database!")


@app.on_event("shutdown")
def shutdown_db_client():
    app.mongodb_client.close()


app.include_router(properties_router, tags=["properties"], prefix="/properties")
