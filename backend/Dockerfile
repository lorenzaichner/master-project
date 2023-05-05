
#Set up the nvidia-docker image for the causal discovery toolbox
#FROM divkal/nv-cdt-py3.7
FROM divkal/cdt-py3.7

WORKDIR /usr/src/app/dowhy
RUN apt-get update
RUN apt-get install -y python3-pip 
RUN pip3 install --upgrade pip setuptools
RUN pip3 install dowhy
RUN pip3 install econml

#install node and npm manually.
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

#set up the backend structure. 
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
  
# set the working directory
WORKDIR /usr/src/app/backend