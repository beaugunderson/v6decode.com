#!/usr/bin/env python2.7

import os

print "Content-Type: text/plain"
print "X-Address: %s" % os.environ["REMOTE_ADDR"]
print
