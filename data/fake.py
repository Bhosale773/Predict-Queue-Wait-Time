import csv
from faker import Faker
import datetime
import random       
    
def datagenerate(records, headers):
    fake = Faker('en_US')
    fake1 = Faker('en_GB')   # To generate phone numbers
    with open("People_data.csv", 'wt') as csvFile:
        writer = csv.DictWriter(csvFile, fieldnames=headers)
        writer.writeheader()
        for i in range(records):
            l=[]
            d=random.choice([0,1,2,3,4,5,6])
            if d==0 or d==6:
                c=random.randrange(16,23,1)
                l.append(c)
                l.append(c)
                l.append(c)
                l.append(0)
                l.append(0)
                c=random.randrange(9,13,1)
                l.append(c)
                l.append(c)
                c=random.randrange(14,16,1)
                l.append(c)
            else:
                c=random.randrange(18,23,1)
                l.append(c)
                l.append(c)
                l.append(c)
                l.append(0)
                l.append(0)
                c=random.randrange(9,13,1)
                l.append(c)
            b=random.choice([2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,4,4,4,4,4,4])
            if b==2:
                st='{:04.1f}'.format(random.uniform(15, 25))
            elif b==3:
                st='{:04.1f}'.format(random.uniform(8, 12))
            else:
                st='{:04.1f}'.format(random.uniform(5, 10))
            st=float(st)
            a=random.randrange(0,50,1)
            if a==0:
                se=0
            else:
                se=a*st
            writer.writerow({
                "dow" : d,
                "hr" : random.choice(l),
                "min" : random.randrange(0,59,1),
                "stage" : b,
                "No.of waiting" : a,
                "Reason" : random.randrange(0,4,1),
                "Serviece time" : se,
                })
            
            
if __name__ == '__main__':
    records = 20000  
    headers = ["dow","hr","min","stage","No.of waiting","Reason","Serviece time"]
    datagenerate(records, headers)
    print("CSV generation complete!")
