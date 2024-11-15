# Virtual Try-On API Documentation

## Overview

This API allows for performing virtual try-on functionality using a human image and a garment image. The backend handles image uploads, processes the images using the Gradio API, and returns the results (output image and masked image) to the client.

## API Endpoints

### 1. `POST /api/virtual-tryon`

This endpoint receives human and garment images and processes them through the Gradio virtual try-on model.

#### Request

**URL**: `/api/virtual-tryon`
**Method**: `POST`
**Headers**:

- `Content-Type: multipart/form-data`

**Request Body**:

- `human` (file): The image of the human model.
- `garment` (file): The image of the garment.
- `maskingMode` (string, optional): Mode for masking the human image. Either "auto" or "manual". Default is "auto".
- `denoisingSteps` (integer, optional): The number of denoising steps. Default is 30.
- `seed` (integer, optional): The random seed used for the process. Default is 42.
- `useAutoMask` (boolean, optional): Whether to use auto-masking. Default is `true`.
- `enhanceOutput` (boolean, optional): Whether to enhance the output image quality. Default is `true`.

#### Example Request (using `FormData` in JavaScript):

```javascript
const formData = new FormData();
formData.append("human", humanImageFile);
formData.append("garment", garmentImageFile);
formData.append("maskingMode", "auto"); // optional
formData.append("denoisingSteps", 30); // optional
formData.append("seed", 42); // optional
formData.append("useAutoMask", true); // optional
formData.append("enhanceOutput", true); // optional

fetch("http://localhost:5000/api/virtual-tryon", {
  method: "POST",
  body: formData,
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
```

### Response

- **Status Code:**

  - `200 OK` (on success)
  - `400 Bad Request` (if required files are missing)
  - `500 Internal Server Error` (on unexpected errors)

- **Response Body (Success):**

```json
{
  "success": true,
  "data": {
    "outputImage": "image-data-or-url",
    "maskedImage": "image-data-or-url",
    "params": {
      "maskingMode": "auto",
      "denoisingSteps": 30,
      "seed": 42,
      "useAutoMask": true,
      "enhanceOutput": true
    }
  }
}
```

### Response Body (Error):

```json
{
  "success": false,
  "error": "Error message",
  "errorType": "ErrorType",
  "errorDetails": "Stack trace (only in development)"
}
```

### Possible Errors:

- **400 Bad Request**: If either the human or garment image is missing from the request body.
- **500 Internal Server Error**: If the Gradio API fails or if there's a server-side issue.

---

### 2. GET /health

This endpoint checks the health of the API and whether the Gradio client is connected.

- **Request:**

  - **URL**: `/health`
  - **Method**: `GET`

- **Example Request (using fetch):**

```javascript
fetch("http://localhost:5000/health")
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
```
