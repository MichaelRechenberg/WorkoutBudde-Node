import random 


firstName = ['Michael', 'John', 'Madi', 'Emma', 'Maddie', 'Jesse', 'Brooke', 'Maria', 'Jack', 'Zach', 'Anthony', 'Harsha', 'Vinay', 'Jak']
lastName = ['Rechenberg', 'Cox', 'Williams', 'Brown', 'Johnson', 'Bain', 'Zubricki', 'Daxter']

def randEle(lis):
  upperBound = len(lis) -1
  if (upperBound == -1):
    raise KeyError('Shit won\'t work fam')
  randNum = random.randint(0, upperBound)
  return lis[randNum]

def coinflip():
  """Returns True or False randomly"""
  return random.randint(0,1) == 0

def genData():
  """Returns an INSERT INTO string for WorkoutBudde users table"""

  result = "INSERT INTO users (username, salt, password, firstname, lastname, street, city, state, zip_code, coord, earth_coord, exer_swimming, exer_cycling, exer_lifting, exer_running, exer_yoga, exer_outdoor_sports, exer_indoor_sports, mon, tues, wed, thurs, fri, sat, sun, mon_start_time, tues_start_time, wed_start_time, thurs_start_time, fri_start_time, sat_start_time, sun_start_time, mon_end_time, tues_end_time, wed_end_time, thurs_end_time, fri_end_time, sat_end_time, sun_end_time, intensity) VALUES ("
  result += "'RANDOMUSERNAME', "

  result += "'7a365de276c45ad70d16', '0c13d9eb8c87513334a6f075796434353cdae33de8496f88012b7894550530481605f5c37e0863f8aff2f7ec34fb7e8b5730082a14ec1aa20002f41aefee2169', "

  result += "'" + randEle(firstName) + "', " 
  result += "'" + randEle(lastName) + "', " 
  result += "'RANDNUM RANDSTREET', "
  result += "'RANDOM CITY', "
  result += "'RANDSTATE', "
  #Zip Code
  result += "13375, "
  lat = str(random.randint(40, 42)) + '.' + str(random.randint(10000, 99999))
  lng = str(random.randint(-88, -86)) + '.' + str(random.randint(10000, 99999))
  result += "POINT(" + lat + "," + lng + "), "
  result += "ll_to_earth(" + lat + "," + lng + "), "

  #Random exercises 
  for x in xrange(7):
    result += str(coinflip()) + ", "

  days = []
  #Days
  for x in xrange(7):
    validDay = coinflip()
    result += str(validDay) + ", "
    days.append(validDay)

  #Times
  for x in xrange(7):
    if(days[x]):
      #Create a random interval of time
      if coinflip():
        start = random.randint(8, 14)
        result += "'{0}:00'::time, ".format(start)
        end = start + random.randint(2, 6)
        result += "'{0}:00'::time, ".format(end)
      #..Or Make it A Full Day
      else:
        result += "'0:00'::time , "
        result += "'23:59'::time , "

    else:
      result += "'0:00'::time, "
      result += "'0:00'::time, "

  #Intensity 
  result += "'C');"
  return result


with open('insert.sql', 'w+') as f:
  for x in xrange(10):
    line = genData() 
    f.write(line + "\n")


