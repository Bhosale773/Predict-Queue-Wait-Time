import csv
import datetime
import random       
    
def datagenerate(records, headers):
    file = open('testing-data.txt','w') 
    with open("testing-data.csv", 'wt') as csvFile:
        writer = csv.DictWriter(csvFile, fieldnames=headers)
        writer.writeheader()
        for i in range(records):
            l=[]
            d=random.choice([0,1,2,3,4,5,6])
            if d==0 or d==6:
                c=random.randrange(16,22,1)
                l.append(c)
                l.append(c)
                l.append(c)
                l.append(0)
                c=random.randrange(9,13,1)
                l.append(c)
                l.append(c)
                c=random.randrange(14,16,1)
                l.append(c)
            else:
                c=random.randrange(18,22,1)
                l.append(c)
                l.append(c)
                l.append(c)
                c=random.randrange(9,13,1)
                l.append(c)
            r=random.randrange(0,5,1)
            b=random.choice([2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,4,4,4,4,4])
            if b==2:
                if r==0:
                    st1=random.randrange(880, 920, 1)
                    st2=random.randrange(880, 920, 1)
                    st3=random.randrange(880, 920, 1)
                    st4=random.randrange(880, 920, 1)
                    st5=random.randrange(880, 920, 1)
                    st6=random.randrange(880, 920, 1)
                    st7=random.randrange(540, 880, 1)
                    st8=random.randrange(920, 1260, 1)
                    st=random.choice([st1,st2,st3,st4,st5,st6,st7,st8])
                elif r==1:
                    st1=random.randrange(2260, 2480, 1)
                    st2=random.randrange(2260, 2480, 1)
                    st3=random.randrange(2260, 2480, 1)
                    st4=random.randrange(2260, 2480, 1)
                    st5=random.randrange(2260, 2480, 1)
                    st6=random.randrange(2260, 2480, 1)
                    st7=random.randrange(2480, 2940, 1)
                    st8=random.randrange(1980, 2260, 1)
                    st=random.choice([st1,st2,st3,st4,st5,st6,st7,st8])
                elif r==2:
                    st1=random.randrange(3300, 3800, 1)
                    st2=random.randrange(3300, 3800, 1)
                    st3=random.randrange(3300, 3800, 1)
                    st4=random.randrange(3300, 3800, 1)
                    st5=random.randrange(3300, 3800, 1)
                    st6=random.randrange(3300, 3800, 1)
                    st7=random.randrange(2400, 3300, 1)
                    st8=random.randrange(3800, 4800, 1)
                    st=random.choice([st1,st2,st3,st4,st5,st6,st7,st8])
                elif r==3:
                    st1=random.randrange(1420, 1580, 1)
                    st2=random.randrange(1420, 1580, 1)
                    st3=random.randrange(1420, 1580, 1)
                    st4=random.randrange(1420, 1580, 1)
                    st5=random.randrange(1420, 1580, 1)
                    st6=random.randrange(1420, 1580, 1)
                    st7=random.randrange(1080, 1420, 1)
                    st8=random.randrange(1580, 1920, 1)
                    st=random.choice([st1,st2,st3,st4,st5,st6,st7,st8])
                elif r==4:
                    st1=random.randrange(1060, 1100, 1)
                    st2=random.randrange(1060, 1100, 1)
                    st3=random.randrange(1060, 1100, 1)
                    st4=random.randrange(1060, 1100, 1)
                    st5=random.randrange(1060, 1100, 1)
                    st6=random.randrange(1060, 1100, 1)
                    st7=random.randrange(840, 1060, 1)
                    st8=random.randrange(1100, 1380, 1)
                    st=random.choice([st1,st2,st3,st4,st5,st6,st7,st8])
                    
            elif b==3:
                st1=random.randrange(50, 80, 1)
                st2=random.randrange(50, 80, 1)
                st3=random.randrange(50, 80, 1)
                st4=random.randrange(50, 80, 1)
                st5=random.randrange(50, 80, 1)
                st6=random.randrange(50, 80, 1)
                st7=random.randrange(40, 50, 1)
                st8=random.randrange(80, 90, 1)
                st=random.choice([st1,st2,st3,st4,st5,st6,st7,st8])
            elif b==4:
                st1=random.randrange(80, 100, 1)
                st2=random.randrange(80, 100, 1)
                st3=random.randrange(80, 100, 1)
                st4=random.randrange(80, 100, 1)
                st5=random.randrange(80, 100, 1)
                st6=random.randrange(80, 100, 1)
                st7=random.randrange(60, 80, 1)
                st8=random.randrange(100, 120, 1)
                st=random.choice([st1,st2,st3,st4,st5,st6,st7,st8])
                
            a=random.randrange(0,50,1)
            h=random.choice(l)
            m=random.randrange(0,60,1)
            writer.writerow({
                "Day of week" : d,
                "Hrs" : h,
                "Mins" : m,
                "Stage" : b,
                "No.of waiting patients" : a,
                "Reason" : r,
                "Service time (secs)" : st,
            })
            st=int(st)*0.01
            d=d*0.1
            h=h*0.1
            b=b*0.1
            r=r*0.1
            file.write(str(st)+" 1:"+str(d)+" 2:"+str(h)+" 3:"+str(b)+" 4:"+str(r)+"\n") 

    file.close() 
            
            
if __name__ == '__main__':
    records = 2000  
    headers = ["Day of week","Hrs","Mins","Stage","No.of waiting patients","Reason","Service time (secs)"]
    datagenerate(records, headers)
    print("CSV generation complete!")
