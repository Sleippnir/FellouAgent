# Live2D Avatar Models

This directory is intended to store the Live2D avatar models used in the application.

## Hiyori Model (Recommended)

The application is configured to use the "Hiyori" model by default. You need to download this model and place its files in a subdirectory here.

### Download Instructions

1.  **Go to the Live2D Sample Data page:**
    [https://www.live2d.com/en/download/sample-data/](https://www.live2d.com/en/download/sample-data/)

2.  **Find the "Hiyori Momose" model:**
    Scroll down to find the "Hiyori Momose" (桃瀬ひより) sample model.

3.  **Download the file:**
    Click the download button to get the ZIP file (`[New]Hiyori_free.zip`).

4.  **Extract the files:**
    Unzip the downloaded file. You will get a folder named `Hiyori_free`.

5.  **Place the files here:**
    Move the contents of the `Hiyori_free` folder into a new directory named `hiyori_free` inside this `models` directory.

### Expected File Structure

After following the steps, your file structure should look like this:

```
public/
└── models/
    ├── hiyori_free/
    │   ├── Hiyori.moc3
    │   ├── Hiyori.model3.json
    │   ├── Hiyori.physics3.json
    │   ├── Hiyori.cdi3.json
    │   ├── expressions/
    │   └── motions/
    └── README.md
```

The application will then be able to load the model from `/models/hiyori_free/Hiyori.model3.json`.
