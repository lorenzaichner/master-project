
#Set up the nvidia-docker image for the causal discovery toolbox
#FROM divkal/nv-cdt-py3.6
FROM divkal/cdt-py3.7

WORKDIR /usr/src/app/dowhy
#RUN apt-get update
RUN apt-get install -y python3-pip 
RUN pip3 install --upgrade pip setuptools
RUN pip3 install dowhy
RUN pip3 install econml

#install cuda
# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    build-essential \
    apt-transport-https

# Download CUDA installer
RUN wget https://developer.download.nvidia.com/compute/cuda/12.1.1/local_installers/cuda_12.1.1_530.30.02_linux.run

# Make the installer executable
RUN chmod +x cuda_12.1.1_530.30.02_linux.run

# Install CUDA
RUN ./cuda_12.1.1_530.30.02_linux.run --toolkit --silent --override

# Cleanup
RUN rm cuda_12.1.1_530.30.02_linux.run

ENV PATH=/usr/local/cuda/bin:$PATH
ENV LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH
ENV CUDA_HOME=/usr/local/cuda


ENV NVIDIA_VISIBLE_DEVICES all
ENV NVIDIA_DRIVER_CAPABILITIES compute,utility
ENV NVIDIA_REQUIRE_CUDA "cuda>=8.0"

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