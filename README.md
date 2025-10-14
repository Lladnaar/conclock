# ConClock

API and distribution server for ConClock apps.

Implements HTTP file server of:
* content in /client folder

Implements REST API with core resources of:
* /api - resource directory
* /api/time - Time syncronisation
* /api/user - User resources
* /api/event - Event / Convention / Seminar resource

## Docker Installation

* Install Docker
* Download ConClock
  * `docker pull ghcr.io/lladnaar/conclock:version`
* Run ConClock
  * `docker run -d lladnaar/conclock -p 9000:9000`

## Standalone Installation

* Install NodeJS
* Install ConClock
  * Unzip conclock.zip into new folder
  * `npm install`
* Run ConClock
  * `npm run start`

## Configuration

The default configuration is set in config.ts. To override create a config.json. Common overrides are:

* server.port: conclock server port number.
* redis.url: redis database connection url.

## Redis

As of version 0.2 you will need a redis server available on redis://redis:6379. This can be altered by setting redis.url in settings-local.json.

## Accessing ConClock

Browse to http://host:8080/ and chose the desired client.

# Development Notes

```mermaid
sequenceDiagram
    actor Alice
    participant Router as Express<br>Router
    participant Rest
    box Typesafe bubble
        participant Resource
    end
    participant Data
    
    note over Alice,Data: POST/PUT
    rect rgb(50%,50%,50%,10%)
        Alice ->> Router: Key (URL)<br>Body (JSON)
        Router ->> Rest: Key (params)<br>Content (body)
        Rest ->> Resource: Content (any)
        Resource -->> Alice: Validation exception (401 - Bad Request)
        Resource ->> Data: Content (type)
        Data ->> Resource: Content (any)
        Resource ->> Rest: Content (type)
        Rest ->> Router: Content (any)
        Router ->> Alice: Content (JSON)
    end

    note over Alice,Data: GET
    rect rgb(50%,50%,50%,10%)
        Alice ->> Router: Key (URL)
        Router ->> Rest: Key (params)
        Rest ->> Resource: Key (any)
        Resource ->> Data: Key (type)
        Data -->> Alice: Lookup exception (404 - Not Found)
        Data ->> Resource: Content (any)
        Resource -->> Alice: Validation exception (500 - Internal Error)
        Resource ->> Rest: Content (type)
        Rest ->> Router: Content (any)
        Router ->> Alice: Content (JSON)
    end
```
 