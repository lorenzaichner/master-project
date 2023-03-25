FROM node:14-buster-slim
# if already built locally before
# FROM cdi_backend

# set the web-backend up
WORKDIR /usr/src/app/backend
RUN mkdir -p storage/uploaded
COPY ./backend/package*.json ./
RUN npm install
COPY ./backend .
COPY ./common ../common
RUN npm run build

# set the python environment up (for the DoWhy lib)
WORKDIR /usr/src/app/dowhy
RUN apt-get update 
RUN apt-get install -y python3-pip
RUN pip3 install --upgrade pip 
RUN pip3 install numpy
RUN pip3 install scipy
RUN pip3 install scikit-learn
RUN pip3 install joblib
RUN pip3 install pandas
RUN pip3 install networkx
RUN pip3 install tqdm
RUN pip3 install GPUtil
RUN pip3 install statsmodels
RUN pip3 install requests
RUN pip3 install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu116
RUN pip3 install dowhy
RUN pip3 install cdt
RUN pip3 install econml

COPY ./dowhy/ ./


WORKDIR /usr/src/app/backend

