FROM nginx:stable-alpine
# Копируем содержимое папки dist (которую мы собрали) в Nginx
COPY ./dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]