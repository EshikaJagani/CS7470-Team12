# features.py - made by Eshika
# keeping this unclean version with refs as per the ed stem post lol
# turning raw sensor nos into a few numbers per window that a model can learn from
# this file will be used by ml/prepare_data.py AND copied as it is to backend/features.py
# so if i change one i HAVE to change the other one too!!! else the server n the model see different numbers
# vector_magnitude n some comments reused from my individual assignment 1 (sensor data analysis, task 3 step counter)
# in ml, keeping diff .py files n not 1 big file so the server only loads features.py + the model
# aanndd doesnt get overloaded with training code, n each step runs on its own
 
'''
main idea on how i am approaching this:
what is needed: the model cant learn from 128 raw readings x 6 axes directly (too many nos n they shift in time)
so for every window i will work out simple stats that describe the movement
 
- window = 128 readings = 2.56 sec at 50 readings per sec (same window size as the classic HAR papers)
- now from my own data in assignment 1 (task 3c):
  -> i walked 100 steps in 52.5 sec, so one step takes 52.5 / 100 = 0.525 seconds
  -> so 2.56 sec / 0.525 sec = abt 5 steps in every window.. enough to see the walking pattern n not just 1 bump!!
- moving the window by 64 each time = 50% overlap, so a step that falls on the edge of 1 window is in the middle of the next
- same trade-off as the moving average window in task 3 (slide 22):
  small window = more detail but more noise, big window = less noise but slower to notice a change
  2.56 sec is in the middle.. the game updates every sec n still sees ~5 steps
- 8 signals: acc x, y, z + acc "size" (vector magnitude) n gyro x, y, z + gyro size
  size = sqrt(x^2 + y^2 + z^2) same vec mag as in my step counter.. it doesnt care which way the phone points in the pocket!!
  (in assignment 1 task 3a my 2 walks had the phone in different positions, n the vec mag is the 1 signal that doesnt depend on which way it points)
- 5 stats for each signal: mean, std, min, max, range (max - min)
- 8 signals x 5 stats = 40 features per window
 
why these simple ones n not fft etc: they are easy to explain in the demo n they already separate walk/jog/stairs/still well
ref1: https://github.com/mmalekzadeh/motion-sense (the dataset, 50 Hz, phone in the front pocket)
ref2: https://numpy.org/doc/stable/reference/generated/numpy.std.html
ref3: https://numpy.org/doc/stable/reference/generated/numpy.sqrt.html
'''
 
import numpy as np
 
# readings per window = 2.56 sec at 50 readings per sec
WINDOW_SIZE = 128
# move the window by half a window each time (50% overlap)
STEP_SIZE = 64
 
# the 8 signals i look at
SIGNAL_NAMES = ['acc_x', 'acc_y', 'acc_z', 'acc_size', 'gyro_x', 'gyro_y', 'gyro_z', 'gyro_size']
 
# the 5 nos i work out for every signal
STAT_NAMES = ['mean', 'std', 'min', 'max', 'range']
 
# all feature names like 'acc_x_mean'.. 8 signals x 5 stats = 40 features
# keeping the names in 1 list so prepare_data, evaluate, export_model n the server all use the SAME order
FEATURE_NAMES = []
for signal_name in SIGNAL_NAMES:
    for stat_name in STAT_NAMES:
        FEATURE_NAMES.append(signal_name + '_' + stat_name)
 
 
def vector_magnitude(data):
    # same as my assignment 1 task 3a, only difference: here the rows are just [x, y, z] (no time column)
    # fetching each row and getting the values for x,y,z and calulating vec mag = sqrt(x^2+y^2+z^2)
    mags = []
 
    for row in data:
        x = row[0]
        y = row[1]
        z = row[2]
 
        mag = np.sqrt(x*x + y*y + z*z)
 
        mags.append(mag)
 
    return np.array(mags)
 
 
def make_features(acc, gyro):
    # acc  = 128 rows of [x, y, z] acceleration without gravity, in g (1 g = 9.81 m/s²)
    # gyro = 128 rows of [x, y, z] rotation speed, in radians per sec
    # gives back a list of 40 nos
    acc = np.array(acc)
    gyro = np.array(gyro)
 
    # "size" of the movement, no matter which way the phone points
    acc_size = vector_magnitude(acc)
    gyro_size = vector_magnitude(gyro)
 
    signals = [acc[:, 0], acc[:, 1], acc[:, 2], acc_size, gyro[:, 0], gyro[:, 1], gyro[:, 2], gyro_size]
 
    features = []
    for signal in signals:
        # float() bcoz numpy nos cant be sent as json by the server later..
        features.append(float(signal.mean()))  # avg
        features.append(float(signal.std()))  # how much it wiggles
        features.append(float(signal.min()))  # lowest value
        features.append(float(signal.max()))  # highest value
        features.append(float(signal.max() - signal.min()))  # distance between lowest n highest
 
    return features
