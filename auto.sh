hugo -d ../public/

cd ../public/

python -m http.server 9000

hugo server -D --bind 0.0.0.0 --port 1317 --baseURL http://localhost:1317
cd -
