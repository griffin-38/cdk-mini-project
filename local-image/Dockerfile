# Use an official Python runtime as a parent image
FROM python:3.9-alpine

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --trusted-host pypi.python.org -r requirements.txt

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Define environment variable
ENV FAVORITE_DESSERT="CHEESECAKE"

# Run app.py when the container launches
CMD ["python", "app.py"]


# # Use an official Python runtime as a parent image docker build -t "appdev:Dockerfile" .
# FROM python:3.4-alpine

# # Set the working directory to /app
# WORKDIR /app

# # Copy the current directory contents into the container at /app
# COPY . /app

# # Install any needed packages specified in requirements.txt
# RUN pip install --trusted-host pypi.python.org -r requirements.txt

# # Make port 8080 available to the world outside this container
# EXPOSE 8080

# # Define environment variable
# ENV FAVORITE_DESSERT="cheesecake"

# # Run app.py when the container launches
# CMD ["python", "app.py"]