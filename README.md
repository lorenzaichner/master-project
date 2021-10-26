# master-project

Software tool for casual inference

How to build it?

```
docker-compose build
```
How to run it? 
```
docker-compose up
```

For development workflow, it is faster to build and run images separately - for backend side(it will also run redis image): 

```
docker-compose build backend
docker-compose up backend
```

For frontend:
```
docker-compose build frontend
docker-compose up frontend
```

If you have problems with apt-get update command during the backend build(failed to fetch from deb.debian.org) add in ```/etc/docker/daemon.json```:
```
{
    "dns": ["1.1.1.1", "8.8.8.8"]
}
```
