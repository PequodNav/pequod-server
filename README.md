# Pequod Server

## Quick Links

  - [AWS Elastic Beanstalk console](https://console.aws.amazon.com/elasticbeanstalk/home?region=us-east-1#/applications)
  - [Mongo Atlas Console](https://cloud.mongodb.com/)

## Endpoints

### /points

#### Query Params

Returns an array of points

  - `lat` - the latitude (required)
  - `lng` - the longitude (required)
  - `distance` - in miles (default 5mi)
  - `limit` - the number of points (default 100)
