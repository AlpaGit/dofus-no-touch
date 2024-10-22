## CURRENT STATE : Display a tactical map
![Current State](https://i.imgur.com/iCBeRdn.png)

## Purpose :
I'm trying to achieve what the Dofus Touch developpers did but in a more modern way,  
The project goal is to port Dofus 2 (2.72) to the Dofus Touch Engine (WebGL)  

This client will be cross-platforms such as (in order of development priority):
- Web
- Desktop native app with a Chromium render such as WebView (cool) or Electron (not cool)
- Mobile application

## Performance : 
Performance will be kept in mind during the development of this project,  
If we can achieve to have something that work smoothly on Web and Mobile the performance are gonna be way higher on Desktop  
The project is in **TypeScript** but if needed some critical performances parts can be rewritten in **WebAssembly**. 

## Assets :
The assets will not be taken from Dofus Touch, out own tools are under creation to convert Dofus 2 and Unity files to a format compatible with this project.
