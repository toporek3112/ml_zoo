#!/bin/sh

# Generate env.js dynamically from environment variables
cat <<EOF > /app/build/env.js
window.RUNTIME_ENV = {
  MODEL_SERVING_API: "${MODEL_SERVING_API}"
};
EOF

# Start serve
exec serve -s build -l 3000
