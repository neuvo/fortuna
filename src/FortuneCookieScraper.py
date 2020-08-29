import requests
from bs4 import BeautifulSoup
from Joke import FortuneCookie

url = 'http://www.fortunecookiemessage.com/'
outname = 'data/fortunecookies.db'
fortune_set = { FortuneCookie.eat(1) }
fobj = open(outname, 'a')

counter = 0
while counter < len(fortune_set)*2:
    print('counter = %d' % counter)
    currlen = len(fortune_set)
    print('found %d fortune_cookies' % currlen)
    fortune = FortuneCookie.eat(1)
    fortune_set.add(FortuneCookie.eat(1))

    if len(fortune_set) > currlen:
        counter = 0
        fobj.write(fortune + '\n')
    else:
        counter += 1

fobj.close()