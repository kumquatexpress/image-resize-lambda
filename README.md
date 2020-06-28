## To use this lambda, create a Dockerfile like the following

    FROM node:6.10

    RUN apt-get update && apt-get install -y \
        vim \
        zip

    # run final setup
    COPY ./package.json /usr/src/app/
    WORKDIR /usr/src/app
    RUN npm install

    COPY . /usr/src/app/

    # image upload only, keys to your S3 bucket
    ENV AWS_KEY [YOURKEYHERE]
    ENV AWS_SECRET [YOURSECRETHERE]

    CMD echo "done"

## in the same directory, and create a zip of the entire directory to deploy to AWS