# Serve the static Jonkler site with nginx.
FROM nginx:1.27-alpine

# Cloud Run injects PORT (defaults to 8080); nginx must listen on it.
ENV PORT=8080

# nginx official image runs envsubst over *.template files at startup,
# writing the result into /etc/nginx/conf.d/. This lets us bind to $PORT.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Static assets.
COPY index.html style.css script.js /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 8080
