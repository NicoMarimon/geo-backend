# Utilizar la imagen oficial de Node.js
FROM node:20

# Crear directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copiar los archivos de package.json y package-lock.json
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto del código de la app
COPY . .

# Exponer el puerto en el que escucha el servidor
EXPOSE 3000

# Comando por defecto para arrancar el backend
CMD ["node", "app.js"]

