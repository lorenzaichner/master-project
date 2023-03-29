# set the python environment up (for the DoWhy lib)
FROM divkal/cdt-py3.7
WORKDIR /usr/src/app/dowhy
RUN apt-get update 
RUN apt-get install -y python3-pip 
RUN pip3 install --upgrade pip 
RUN pip3 install numpy    
RUN pip3 install pandas
RUN pip3 install scikit-learn
RUN pip3 install dowhy
RUN pip3 install econml

#FROM node:14-buster-slim

ENV NODE_VERSION=16.13.0
RUN apt install -y curl
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version

WORKDIR /usr/src/app/backend
RUN mkdir -p storage/uploaded
COPY ./backend/package*.json ./
RUN npm install
COPY ./backend .
COPY ./common ../common
RUN npm run build
WORKDIR /usr/src/app/dowhy
COPY ./dowhy/ ./
WORKDIR /usr/src/app

#COPY --from=estimation /usr/local/bin/ /usr/local/bin/
#COPY --from=estimation /usr/local/lib/python3.7/site-packages/ /usr/local/lib/python3.7/site-packages/
#COPY --from=estimation /usr/local/lib/R/site-library/ /usr/local/lib/R/site-library/
  
# set the working directory
WORKDIR /usr/src/app/backend