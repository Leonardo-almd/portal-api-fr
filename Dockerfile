# Usar imagem base Node.js
FROM node:latest

# Definir diretório de trabalho
WORKDIR /usr/src/app

# Copiar arquivos de dependências
COPY package*.json ./

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install curl gnupg -y \
  && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install google-chrome-stable -y --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Instalar dependências
RUN npm install

# Copiar todos os arquivos do projeto
COPY . .

# Gerar a build do NestJS
RUN npm run build

# Expor a porta da API
EXPOSE 3000

# Comando para iniciar a API em produção
CMD ["node", "dist/main"]
