#!/usr/bin/env python3

import os

print("Content-Type: text/plain")
print("X-Address: %s" % os.environ.get("REMOTE_ADDR"))
print()
