docker run --name db -e POSTGRES_PASSWORD=pass -e POSTGRES_USER=user -d -p 5432:5432 --rm postgres
docker exec -it db psql -U user -d db

docker stop db
