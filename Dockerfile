FROM node:8

# Set the working directory
WORKDIR /opt/zipstream

# Setup User
RUN useradd -M -d $PWD user
RUN chown -R user.user .
USER user

# Install packages
COPY --chown=user:user package.json .
COPY --chown=user:user yarn.lock .
RUN yarn

# Build
COPY --chown=user:user src ./src
COPY --chown=user:user gulpfile.babel.js .
RUN yarn build
COPY --chown=user:user .eslintrc getversion ./


# Run server when the container launches
ENV PORT=4040
CMD node dist/index.js
HEALTHCHECK \
  --interval=1m --timeout=3s  \
  CMD curl -f http://localhost:4040/health-check || exit 1

EXPOSE 4040
