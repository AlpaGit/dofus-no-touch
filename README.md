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
The project is in **TypeScript** but if needed some critical performances parts can be rewritten in **WebAssembly**  

## Assets :
The assets will not be taken from Dofus Touch, out own tools are under creation to convert Dofus 2 and Unity files to a format compatible with this project  

## TODO (things will get deleted):
- [x] Create a DLM reader and display any tactical map
- [ ] Display a real map
- [ ] 16/9, Dofus touch was in 4/3, we don't want a real 16/9 but like Dofus 2 is doing it (resizable to 4/3) 
- [ ] Convert the WebGLRenderer code to WebGPU (we want to use the modern API so we have to change that, also convert the shaders to wgsl
- [ ] Convert the Map background asset to one big asset for better loading time, also optimize the files length [Look into this](https://github.com/Wizcorp/docker-gameassets)
- [x] Recreate the WebGL classes and IsoEngine / Camera (w/zoom)

## Dofus Unity :
I strongly believe that Unity is a way too powerful engine to be used in such a light game as Dofus (it's just a canvas with some images moving and shaders) and because of the Unity boilerplait it causes it to use way more RAM / Performance than it should.  

This project is from an alternative universe where Ankama decided to work on Dofus 3 with the of Dofus Touch technology instead of recreating a new game
