If you like my work consider a donation: [![donate](https://img.shields.io/badge/donate-ko--fi-orange)](https://ko-fi.com/chromoxdor)


# EasyFetch - dashboard for ESPeasy

*!Note: I added some things and changed the eventnames the slider create. Latest additions can be found here: https://www.letscontrolit.com/forum/viewtopic.php?p=61671#p61671 (Documentation here will be updated later)*

Easyfetch is a alternative dashboard in tile optic for ESPeasy (https://github.com/letscontrolit/ESPEasy). It was created to have a quick and relatively simple way of visualizing data and interacting with the hardware (buttons & slider) in a browser. Especially where no bigger infrastructure like a homeautomation server is needed (the ability to write complex rules in espeasy and the ability of communication between the nodes via a simple p2p-network can often make a full blown home automation system unnecessary).

![easyfetchmain](https://github.com/chromoxdor/easyfetch/assets/33860956/cd19b11f-40d6-42ef-9f26-86ef43c0920c)


## Overview:
The Dashboard consists of different elements with different purposes:

  1. **main-section:** the tasks you have in espeasy are rendered here in tiles. There are a lot of options to customize these.
There are 3 possible categories: 
     1. big-values
     2. slider
     3. the rest: buttons and "ordinary" tiles

  2. **unit-menu:** Here are all the units listed, that are connected via the controller called ESPEasy P2P Networking (https://espeasy.readthedocs.io/en/latest/Controller/C013.html)
     * next to the unitname is the unitnumber.
     * the symbol "⊙" leading the unitname marks the unit wich serves the easyfetch.html 

  3. **unit-name:** the unit-name of the unit that is actual selected. next to it is the signalstrength in dBm of this unit.
     * clicking it enters fullscreen mode on supported browsers

  4. **menu and splitview buttons:** 
     * the left button opens the unit-list 
     * the right button opens the devices-page of the espeasy unit in a splitview for easier dashboard creation (on smartphones it overlays the page instead because of limited space). If long-clicked this button leaves easyfetch and directs to the tools page of the selected unit.

<img width="399" alt="main" src="https://user-images.githubusercontent.com/33860956/158618125-4e73ae1f-a0f7-4cf1-87c2-982e93c036e8.png">

## Creating a Dashboard:

Here you can see the corresponding devices page of the unit: "testesp" (click on the ⌂︎ - symbol to open the split view):

<img width="740" alt="main split" src="https://user-images.githubusercontent.com/33860956/158621473-f1e1525d-5028-4299-9bc5-15b2d6bc7ff9.png">

### Install:

1. Download the fetch.html or better for limited space the fetch.html.gz to your computer. (It is also possible to name it index.htm or index.htm.gz to replace the main page)

2. Use a browser and open your ESPEasy Device at http://<ESP_DEVICE_IP>
   (Note: replace <ESP_DEVICE_IP> with your device's Local IP Address)

3. Go to the "Tools" Tab

4. Select the "Filesystem->File browser" button.

5. Click the "Upload" button.

6. Click the "Browse..." button and select the fetch.html file.

7. Click the "Upload" button.

Use your browser to view the new dashboard: http://<ESP_DEVICE_IP>/fetch.html ( or http://<ESP_DEVICE_IP>/fetch.html.gz ).
You should now see all the ESPEasy device tasks and states.
(Note: For multiple espeasy devices in a network you´ll need only one device with the fetch.html as a primary device when all communicate via the p2p controller. ESPEasy P2P Networking msut be added in /Controllers. See: https://espeasy.readthedocs.io/en/latest/Controller/C013.html?highlight=p2p)

### Display options:


***

**1. ordinary Tile:**
  - Each task is without further ado rendered as a tile. These tiles are arranged by their tasknumbers.
  - On the upper left is the taskname and aligned right if present are the valuenames and their values
  - These tiles (and the buttons too) can be clicked and longclicked and trigger an event which can be accessed in rules
    - if clicked short  `<taskname>event` and if longclicked `<taskname>long`
     - rulesexample: 
       <pre><code>
       on sensorevent do
       dosomething
       endon
       </code></pre>
 

    <img width="500" alt="s1" src="https://user-images.githubusercontent.com/33860956/159250534-96dcd024-1d28-44d0-9174-a84390819379.png">


***

**2. Buttons:**
  - Buttons are basically ordinary tiles where the valuenames/values are not rendered
  - They have the ability to change their color depending on their state
  - There are two options to generate a button tile:
     1. Name the first value of a Task "btnState" (a button whose color is dependent of the btnState 0=no color 1=blue) or “btnStateC” (this button is independent from its state always blue)
     ![button simple](https://user-images.githubusercontent.com/33860956/159255555-d7caea8e-4913-4a4b-98b7-f9a83e5c4f3c.png)
     (the device here is a sonoff s20 and since we do not need the first button, since its the hardwarebutton, on our dahboard we can hide it with the "XX" option. the second button is the actual relay so the state changes depending on the gpio state)
     
        The rule for it:
         <pre><code>
          On buttonevent do
           gpiotoggle,12
          endon
         </code></pre>

     2. Name a dummy device something that consists "dButtons" and every value becomes a button. 
        - You can add an option for colorbuttons with "?C"(see picture below)
        - put "&\<unit_number>" to the end of the valuename to send this buttonevent to a specific device. (e.g. valuename "button&2" will result in this           command: `SendTo,2,"event,ButtonEvent"` or if longclicked `SendTo,2,"event,ButtonLong"`)
        - put "&A" to the end of the valuename and the event will be send to all connected nodes

         <img width="600" alt="b1" src="https://user-images.githubusercontent.com/33860956/159254570-8156aadb-2216-4cc3-88fe-a43a4747743b.png">
         <img width="200" alt="b1f" src="https://user-images.githubusercontent.com/33860956/159254576-76b425bc-58c5-4e3e-9142-5b04a39bde3a.png">

  - Alert: whenever the value of “btnState” / “btnStateC” or any value in a "dButtons" task is 2 the tile becomes red.


***

**3. Slider**

 - Slider: there are two types of slider. The “ordinary” slider and the “time" slider
 - Every slider calls an event when finished sliding. (e.g. “sliderEvent”)
 - To create a slider name a dummy device either "vSlider", "nvSlider" or "tSlider"

    1. The ordinary slider: There are two versions too:

        1. The slider with values displayed: name a task something consisting of “vSlider” and every item will become a Slider with values shown while sliding

        2. The slider with values hidden: name a task something consisting of “nvSlider”

        - For both kinds of slider you can set a minimum, a maximum and the steps.
        - To achieve this add ?<minimum>?<maximum>?<steps> to the itemname (e.g. slider?0?100?0.1)
        - For the slider that shows values (vSlider) you can also add a unit of measurement if you set you personal range (e.g. slider?0?100?0.1?°C)

          Notice: if you use this you must use it altogether. Standard values if unset are min=0 max=1023 step=1.

          <img width="600" alt="vS1" src="https://user-images.githubusercontent.com/33860956/159258001-6dcc11d5-e6cb-471e-b115-4cfb14c600e6.png">
         
         - If you add "Sw" to the Taskname (e.g. “vSliderSw” ), a "switch" function is added to the slider. If you click on the left 1/10th of the slider, the value becomes the set minimum (default=0) and if you click on   the right 1/10th, it becomes the maximum (default=1023)

   2. The "time" slider: Name a task something consisting of “tSlider” and every item will become a "time" slider. (Important! To make this work you need to set the number of decimals to 4)
      - The "time" slider stores the values of both times in one number. This makes it easier to store these values with the regulator - level 
        control plugin since only one plugin for both values is needed
      - This slider has two thumbs for two time values (e.g. on and off time). Both times are stored in the corresponding taskvalue. The code 
        example shows how to make use of it (for persistant storage of the values add the "level control" plugin):
      <pre><code>
       On System#Boot Do //retrieve the values after a power loss back from the "level control" plugin
          TaskValueSet,tslider,1,[timekeepXX#getlevel]/10000 
          Let,1,[tSlider#Time] 
          Let,2,[var#1]*10000-[var#1#F]*10000
       Endon

       On tSliderEvent do
          TimerSet,2,10 // after 10secs store the value in the "level control" plugin
          Let,1,[tSlider#Time]
          Let,2,[var#1]*10000-[var#1#F]*10000
       endon

       On Rules#Timer=2 Do
          config,task,timekeepXX,SetLevel,[tSlider#Time]*10000  //level stores only two digits so we make an integer 
       Endon

       On Clock#Time=All,**:** Do
          If %syssec_d%/60>=[var#1#F] And %syssec_d%/60<[var#2]
            GPIO,2,1
          Else
            GPIO,2,0
          Endif
       Endon
      </code></pre>

      <img width="271" alt="Bildschirmfoto 2022-12-04 um 20 02 16" src="https://user-images.githubusercontent.com/33860956/205510139-1d45055f-bd29-4ca7-8e39-e08eb466d809.png">
      <img width="600" alt="Bildschirmfoto 2022-12-04 um 20 02 29" src="https://user-images.githubusercontent.com/33860956/205510141-8f6e3c84-4bda-40c0-8d95-dea4c8c140d8.png">


***

**4. Big values**

- Big values are displayed when the taskname consist of “bigVal” or if colored “bigValC” 
- You can call an item of a “bigVal” Task something that consists “clock”/”time”, “date”, “year” to get this displayed independent of the value. (german speaking persons can also use “uhr” / "zeit", “datum” -> for date format with dots and "jahr") 

  <img width="150" alt="n2" src="https://user-images.githubusercontent.com/33860956/155341837-04b8feb2-77c6-4c88-bfa7-53f5d2644247.png">
  <img width="600" alt="bv1" src="https://user-images.githubusercontent.com/33860956/155341853-9ff7fc08-bc97-4d94-bd9d-ed66de8ed7ea.png">


***

**5. Additional things**

 - Thingspeak: add a thingspeak value to display the last value of a field of a public thingspeak channel, use this scheme for a valuename: 
   "name&<channel>&<fieldnumber>" optional you can give it a unit of measurement with ?<unit of measurement> (like in every other field):

<img width="547" alt="ts1" src="https://user-images.githubusercontent.com/33860956/159266759-b0431e09-75cc-46c6-8b72-353b8bb36f9d.png"> <img width="73" alt="ts1f" src="https://user-images.githubusercontent.com/33860956/159266767-14c3b32c-a429-482f-8e78-46eb23f59275.png">


<img width="546" alt="ts2" src="https://user-images.githubusercontent.com/33860956/159266771-29123c9b-0d32-4109-b681-566101caa433.png"><img width="143" alt="ts2f" src="https://user-images.githubusercontent.com/33860956/159266774-5fdb5ff3-9f60-49d4-a4dd-f4d5170afa5c.png">

 - Grid layout (desktop view): 
    - the amount of colums (1,2,3 or maximum 4) is determined by the ammount of tiles. 
      - 1 tile = one colum
      - 2 - 4 tiles = 2 colums 
      - 5 - 9 tiles = 3 colums
      - \> 9 tiles = 4 colums
    - The amount of "big values" however is prioritized for rendering the grid layout and constraints it.
      - e.g. if a 4 colum grid is preferred just create a dummy-device with 4 values and call it "bigVal"
        but if you only have 3 values to display you can add an empty "big value" tile by calling an valuename "noVal" or hide it with "XX"
![gridnorm](https://user-images.githubusercontent.com/33860956/159264739-6e322a4a-6f8e-46b3-be83-8b2ee6d7c4e7.png)   
![grid_noval](https://user-images.githubusercontent.com/33860956/159264715-8d959949-29cb-42e3-b78b-e73d1c439bd4.png)
![grid_XX](https://user-images.githubusercontent.com/33860956/159264731-da04fd8d-4006-409d-b324-659d877b5fcd.png)

    - with this "trick" you can have a 2 colum grid layout even wihout displaying any "big values":
![grid_2](https://user-images.githubusercontent.com/33860956/159265483-e06527c4-25ba-4f0a-bf9c-196242ae849a.png)


 

***

### Display options overview:
(options are case sensitive!)

**Options via taskname:**

The taskname needs to contain one of these phrases. E.g. 1bigVal, bigVal1, bigVal2, bigValtwo,...

* dButtons  --- creates an array of buttons (dummy device)
* pButtons  --- creates an array of push buttons (dummy device)
* vInput  --- creates an array of number Inputs (dummy device)
* bigVal / bigValC --- creates "big values" (any device)
* vSlider / nvSlider --- creates an array of "ordinary" slider (dummy device)
  - To add "switch"-behavior in a slider a "Sw" needs do be added to "vSlider" or "nvSlider"
e.g.: "vSliderSw"
* tSlider  --- creates an array of "time" slider (dummy device)
* neoPixel  --- creates a Slider for a neopixel device (valuenames can be named "h"(ue) and/or "s"(saturation) and/or "v"(alue) ) (dummy device)
* "?\<hexcolor>"  --- gives the a "normal" and "bigVal" tile a specific color (note: hexcolor must be added without "#" e.g. "MyValuename?00b300") (note2: "normal" tile means no dButtons,pButtons,vInput,Slider,neoPixel) 
* XX --- hides the task (any device)

**Options via valuename:**

The valuename needs to contain one of these phrases:

* State / iState --- renders a button if beein the first value (switch plugin) - since mega-20221224
* btnState / btnStateC --- renders a button if beein the first value (switch plugin) - before mega-20221224 (needs additional rules)
* pState --- creates an event instead of toggeling the corresponding gpio (switch plugin) - used for pushbuttons 
* Clock / Time / Uhr / Zeit --- valuename for displaying the time set in espeasy (big values)
* Date / Datum  --- valuename for displaying the date set in espeasy (big values)
* Year / Jahr  --- valuename for displaying the year set in espeasy (big values)
* XX --- append this to the valuename to hide this value (any value)
* noVal --- generates an empty tile (buttons, slider, inputs, big values)
* noValAuto --- generates an empty tile which hides automatically in 2-row mode (buttons, inputs, big values)


These option needs to be at the end of the valuename:

* vSlider / nvSlider: "?\<min>?\<max>?\<step>"  (hint: change the number of decimals of the value to correspond with the stepsize)


This options needs to be at the very end and of the valuename:
  (e.g. "iamaslider?0?100?0.5?ms)
* "?\<UM>"  --- unit of measurement (any valuename)
* "&\<unit_number>" or "&A" --- sends the event to the specific unit or if "A" to all units (only dButtons)

### Button cheat sheet:
<img width="617" alt="settings" src="https://github.com/user-attachments/assets/5cdd2984-79b1-4c52-a8ab-bbf5bb40568b">


