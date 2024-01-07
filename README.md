# AudioRecorder 🎤
## BY Sertis:
+ AlexRivasMachín 🌶️
+ gomezbc 🥥
+ MartinLopezDeIpina 🍍
## Documentación 📃
### ¿Que hace nuestra app?
+ Nuestra aplicación es una herramienta para la grabacíon y reproducción de audio.
### ¿Que elementos tiene?
+ Tiene un menu de navegación vertical para tener información del audio y todo lo que pasa en todo momento. También el menu de reproducción es intercactivo. Y verificación de usuarios con *OAuth*
### WhisperAI 🤖
+ Mediante la libreria de *transformers.js* podemos transcribir los audios a texto, permite ingles y español.

## Como inicializar la app 🎤
Siempre que tengas node instalado, empieza usando en la terminal el comando:`npm start`
+ Para instalar la librerias necesarias: `npm install`
+ Si tienes una URI de mongodb distinta a *mongodb://localhost:27017/grabaciones*, deberás cambiar esta URI por la tuya en los ficheros auth.js, app.js y transformers.mjs. 
+ Por otra parte hacemos uso de **ffmpeg**, para que la conversión de los audios con la IA no de ningún problema estando en el navegador que estes.

### FFMPEG 🔹
Para transformar los audios a .wav hacemos uso de una librería que funciona como envoltorio sobre la herramienta **ffmpeg**. Por lo que hay que instalarla en nuestro ordenador.  
#### Linux 🥇
En linux puedes descargar la herramienta mediante el comando en la terminal: 

Ubuntu y Debian: `sudo apt install ffmpeg` 

Fedora: `sudo dnf install ffmpeg` 

#### Windows 🪟
Descargar ffmpeg: [https://www.ffmpeg.org/download.html](https://www.ffmpeg.org/download.html)

Descargar ffmpeg mediante winget (recomendado): `winget install "FFmpeg (Essentials Build)"`

Una vez clonado el repositorio de GitHub , nos movemos al directorio del repositorio clonado e instalamos las librerías de npm mediante npm install. Una vez instaladas, lanzaremos la aplicación mediane npm start. 


### Docker  🐳
> [!WARNING]
>  Transformer.js consume una gran cantidad de memoria RAM, por lo que primero debes asegurarte de que tu límite de RAM para Docker es de al menos 4GB. Puedes cambiar este ajuste en Docker Desktop, `Settings` -> `Resources` -> `Memory limit`. En caso de no disponer de tanta RAM puedes lanzar los contenedores, pero ten en cuente que si usas alguna característica de Transformer.js la aplicación finalizara al superar el límite de memoria. 

Asegúrate de tener Docker corriendo. 

Una vez clonado el repositorio de GitHub , nos movemos al directorio del repositorio clonado y lanzamos el siguiente comando: `docker compose up –d`.  

Una vez los contenedores han arrancado, la aplicación estará en marcha en el puerto 5000. 

## Recomendaciones 📔
Pese a funcionar en todos los navegadores, estos la soportan perfectamente:
+ Google Chrome 🌎
x+ Firefox 🦊
+ Brave 🦁
