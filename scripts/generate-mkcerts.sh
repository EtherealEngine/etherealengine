#!/usr/bin/env bash
if ! command -v -- "mkcert" > /dev/null 2>&1; then
  echo "ERROR: mkcert not installed."
  exit 1
fi
DIR=`pwd`/../certs
set -a; source ../.env.local; set +a
case "$(uname -s)" in
   Darwin)
    rm -f $DIR/mkcert-cert.pem
    rm -f $DIR/mkcert-key.pem
    mkcert -install
    mkcert -cert-file $DIR/mkcert-cert.pem -key-file $DIR/mkcert-key.pem $VITE_APP_HOST
     ;;
   Linux)
    rm -f $DIR/mkcert-cert.pem
    rm -f $DIR/mkcert-key.pem
    mkcert -install
    mkcert -cert-file $DIR/mkcert-cert.pem -key-file $DIR/mkcert-key.pem $VITE_APP_HOST
     ;;
   CYGWIN*|MINGW32*|MSYS*|MINGW*)
     echo 'MS Windows'
     echo "Automatic cert generation for SSL isn't supported on Windows, please add this code"
     ;;
   *)
    echo 'Not supported.'
    echo 'Other OS' 
     ;;
esac