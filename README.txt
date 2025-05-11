Branch sobre el backend del proyecto.

Comandos GitHub:
    - git init
    - git remote add origin https://github.com/CristianMorata/TFG.git --> Vincular local con remoto
    - git branch -M backend --> Vincular con branch creado (si lo hay)
    - git status --> Comprobar que contenido esta sin comitear, cual esta comiteado, etc.

Actualizar información del branch al local:
    - git pull origin backend

Subir/actualizar información del local al branch:
    - git add .
    - git commit -m "nombre_commit"
    - git push

Instalaciones:
    - npm install express firebase-admin
    - npm install -g firebase-tools
    - npm install cors (Solo para pruebas, despues no usar)

Problemas solucionados:
    · Deploy en Firebase Functions:
        - Instalar Node 20 por versiones de firebase
        - Edición de index.js y package,json en /functions e inclusión del script 'lint'
        - Borrado de package-lock y node_modules y reinstalación de estos con parçametros correctos


Created by Cristian Morata.