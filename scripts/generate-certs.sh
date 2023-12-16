#!/usr/bin/env bash
if (( $EUID != 0 )); then
    echo "Please run as root"
    exit
fi
case "$(uname -s)" in
   Darwin)
     echo 'Mac OS X'
     ;;
   Linux)
    mkdir -p ../certs
    openssl req -nodes -new -x509 -keyout ../certs/key.pem -out ../certs/cert.pem ./opensslcnf
    cp ../certs/cert.pem /usr/local/share/ca-certificates/etherealengine-local-certificate.crt
    dpkg-reconfigure ca-certificates
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