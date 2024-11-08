FROM python:3.10-slim

RUN apt-get update && apt-get install -y cron

WORKDIR /app

COPY ./scraper /app

COPY ./requirements.txt /app

RUN pip install -r requirements.txt

