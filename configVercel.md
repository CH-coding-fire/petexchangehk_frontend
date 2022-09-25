  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://petexchangehk.herokuapp.com/:path*"
    },
    {
      "source": "/api/:path*/",
      "destination": "https://petexchangehk.herokuapp.com/:path*/"
    }
  ]