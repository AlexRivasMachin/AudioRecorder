# AudioRecorder 🎤
## BY Sertis:
+ AlexRivasMachín 🌶️
+ gomezBc 🥥
+ MartinLopezDeIpina 🍍
## Documentación 📃
### ¿Que hace nuestra app?
+ Nuestra aplicación es una herramienta para la grabacíon y reproducción de audio.
### ¿Que elementos tiene?
+ Tiene un menu de navegación vertical para tener información del audio y todo lo que pasa en todo momento. También el menu de reproducción es intercactivo. Y verificación de usuarios con *OAuth*
### WhisperAI 🤖
+ Mediante la libreria de *transformers.js* podemos transcribir los audios a texto, permite ingles y español.

## Como inicializar la app 🎤
Siempre que tengas node instalado, empieza usando en la terminal el comando:`node app.js`
+ Puede que pida la instalación de varias librerías, por tanto se instalarán con: `npm install <nombreDeLaLibrería>`
+ Por otra parte hacemos uso de **ffmpeg**, para que la conversión de los audios con la IA no de ningún problema estando en el navegador que estes.

### FFMPEG 🔹
#### Linux 🥇
En linux puedes descargar la herramienta mediante el comando en la terminal: 

Ubuntu y Debian: sudo apt install ffmpeg 

Fedora: sudo dnf install ffmpeg` 

#### Windows 🪟
Descargar ffmpeg: https://www.ffmpeg.org/download.html 

Descargar ffmpeg mediante winget (recomendado): winget install "FFmpeg (Essentials Build)" 

Una vez clonado el repositorio de GitHub , nos movemos al directorio del repositorio clonado e instalamos las librerías de npm mediante npm install. Una vez instaladas, lanzaremos la aplicación mediane npm start. 


### Docker  🐳

ADVERTENCIA: Transformer.js consume una gran cantidad de memoria RAM, por lo que primero debes asegurarte de que tu límite de RAM para Docker es de al menos 4GB. Puedes cambiar este ajuste en Docker Desktop, Settings-> Resources -> Memory limit. En caso de no disponer de tanta RAM puedes lanzar los contenedores, pero ten en cuente que si usas alguna característica de Transformer.js la aplicación finalizara al superar el límite de memoria. 

Asegúrate de tener Docker corriendo. 

Una vez clonado el repositorio de GitHub , nos movemos al directorio del repositorio clonado y lanzamos el siguiente comando: docker compose up –d.  

Una vez vea los siguientes logs en la terminal, significa que la aplicación ya está en marcha en el puerto 5000. 

## Recomendaciones 📔
Pese a funcionar en todos los navegadores, estos la soportan perfectamente:
+ Google Chrome 🌎
+ Firefox 🦊
+ Brave 🦁
