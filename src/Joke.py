import requests
from bs4 import BeautifulSoup
import random
import time

url = 'http://www.fortunecookiemessage.com/'
database_path = '../data/cookies.db'

class FortuneCookie:
    def __init__(self):
        db = open(database_path)
        i = -1
        for i, line in enumerate(db):
            pass
        self.numcookies = i
        db.close()

    def eat(self,num):
        startTime = time.time()
        result = ''
        randos = []
        for i in range(num):
            randos.append(random.randint(0,self.numcookies-1))

        print(randos)
        db = open(database_path)

        for count, line in enumerate(db):
            for rando in randos:
                if count == rando:
                    result += line

        db.close()

        print('Took %f seconds' % (time.time() - startTime))

        return result


    def eat_deprecated(self,num):
        startTime = time.time()
        result = ''
        for i in range(num):
            response = requests.get(url)
            soup = BeautifulSoup(response.text, 'lxml')
            cookie = soup.find_all('a', class_='cookie-link')
            if len(cookie) > 0:
                cookie = str(cookie[0])

            end = cookie.find('</')
            cookie = cookie[:end]
            start = cookie.rfind('>')+1
            cookie = cookie[start:]
            result += cookie+'\n'

        print('Took %f seconds' % (time.time() - startTime))

        return result
