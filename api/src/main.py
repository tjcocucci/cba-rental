from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import dotenv_values
from pymongo import MongoClient
from routes import router as properties_router

config = dotenv_values(".env")
user = config["MONGO_USERNAME"]
password = config["MONGO_PASSWORD"]
host = config["MONGO_HOST"]
port = config["MONGO_PORT"]
allowed_hosts = config["ALLOWED_HOSTS"].split(" ")

MONGO_URL = f"mongodb://{user}:{password}@{host}:{port}/"


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_hosts,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_db_client():
    app.mongodb_client = MongoClient(MONGO_URL)
    app.database = app.mongodb_client[config["DB_NAME"]]
    print("Connected to the MongoDB database!")


@app.on_event("shutdown")
def shutdown_db_client():
    app.mongodb_client.close()


app.include_router(properties_router, tags=["properties"], prefix="/properties")
