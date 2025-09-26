FROM python:3.10

# Install the package that provides the 'envsubst' command
RUN apt-get update && apt-get install -y gettext-base

# Set the working directory
WORKDIR /app

# Copy all the frontend files
COPY . .

# Expose the port the server runs on
EXPOSE 3000

# The command will now first generate the config from the template
# and then start the web server.
CMD /bin/sh -c "envsubst < config.template.js > config.js && python server.py"
