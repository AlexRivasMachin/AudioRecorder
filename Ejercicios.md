# Audio Event Listeners

| Evento               | Descripción                                          | Uso Común                                          | Ejemplo                                           |
| -------------------- | ---------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------- |
| `onloadedmetadata`   | Se lanza cuando los metadatos del audio están cargados. | Puede utilizarse para mostrar información sobre el audio una vez que está disponible. | `console.log("Metadatos cargados:", this.audio.duration, "segundos");` |
| `ondurationchange`   | Se lanza cuando cambia la duración del audio.        | Útil para actualizar la interfaz de usuario con la duración actualizada del audio. | `console.log("Duración del audio cambiada a", this.audio.duration, "segundos");` |
| `ontimeupdate`       | Se lanza cuando cambia el tiempo de reproducción del audio. | Ideal para actualizar la barra de progreso durante la reproducción. | `console.log("Tiempo de reproducción actualizado:", this.audio.currentTime, "segundos");` |
| `onended`            | Se lanza cuando la reproducción del audio ha terminado. | Puede utilizarse para reproducir automáticamente el siguiente elemento en una lista de reproducción. | `console.log("Reproducción del audio finalizada"); reproducirSiguienteAudio();` |

