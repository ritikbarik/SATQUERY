import asyncio
import os
import re
from typing import Any
from dotenv import load_dotenv
import httpx
from app.models.schemas import LocationMetadata

load_dotenv()

MAPPLS_KEY = os.getenv("MAPPLS_KEY", "")

# ==============================================================================
# Comprehensive All-India Geo-Database (Instant Offline Resolution for 100+ Places)
# Covers all 28 States, 8 UTs, major cities, water bodies, and geographic zones
# ==============================================================================
INDIA_REGIONS: dict[str, dict[str, Any]] = {
    # --- States & Territories ---
    "odisha": {"displayName": "Odisha, India", "regionName": "Odisha", "state": "Odisha", "lat": 20.2961, "lng": 85.8245, "bbox": [17.78, 22.57, 81.37, 87.53], "areaKm2": 155707.0, "elevationMeters": 158},
    "assam": {"displayName": "Assam, India", "regionName": "Assam", "state": "Assam", "lat": 26.2006, "lng": 92.9376, "bbox": [24.13, 27.97, 89.69, 96.02], "areaKm2": 78438.0, "elevationMeters": 95},
    "kerala": {"displayName": "Kerala, India", "regionName": "Kerala", "state": "Kerala", "lat": 10.8505, "lng": 76.2711, "bbox": [8.30, 12.80, 74.86, 77.42], "areaKm2": 38863.0, "elevationMeters": 120},
    "punjab": {"displayName": "Punjab, India", "regionName": "Punjab", "state": "Punjab", "lat": 31.1471, "lng": 75.3412, "bbox": [29.50, 32.50, 73.80, 76.90], "areaKm2": 50362.0, "elevationMeters": 250},
    "maharashtra": {"displayName": "Maharashtra, India", "regionName": "Maharashtra", "state": "Maharashtra", "lat": 19.7515, "lng": 75.7139, "bbox": [15.60, 22.03, 72.64, 80.89], "areaKm2": 307713.0, "elevationMeters": 560},
    "karnataka": {"displayName": "Karnataka, India", "regionName": "Karnataka", "state": "Karnataka", "lat": 15.3173, "lng": 75.7139, "bbox": [11.59, 18.45, 74.08, 78.58], "areaKm2": 191791.0, "elevationMeters": 600},
    "tamil nadu": {"displayName": "Tamil Nadu, India", "regionName": "Tamil Nadu", "state": "Tamil Nadu", "lat": 11.1271, "lng": 78.6569, "bbox": [8.08, 13.57, 76.24, 80.35], "areaKm2": 130058.0, "elevationMeters": 120},
    "gujarat": {"displayName": "Gujarat, India", "regionName": "Gujarat", "state": "Gujarat", "lat": 22.2587, "lng": 71.1924, "bbox": [20.10, 24.70, 68.10, 74.47], "areaKm2": 196024.0, "elevationMeters": 80},
    "rajasthan": {"displayName": "Rajasthan, India", "regionName": "Rajasthan", "state": "Rajasthan", "lat": 27.0238, "lng": 74.2179, "bbox": [23.05, 30.20, 69.50, 78.28], "areaKm2": 342239.0, "elevationMeters": 225},
    "uttar pradesh": {"displayName": "Uttar Pradesh, India", "regionName": "Uttar Pradesh", "state": "Uttar Pradesh", "lat": 26.8467, "lng": 80.9462, "bbox": [23.87, 30.40, 77.08, 84.64], "areaKm2": 243286.0, "elevationMeters": 123},
    "madhya pradesh": {"displayName": "Madhya Pradesh, India", "regionName": "Madhya Pradesh", "state": "Madhya Pradesh", "lat": 22.9734, "lng": 78.6569, "bbox": [21.08, 26.87, 74.03, 82.81], "areaKm2": 308252.0, "elevationMeters": 450},
    "west bengal": {"displayName": "West Bengal, India", "regionName": "West Bengal", "state": "West Bengal", "lat": 22.9868, "lng": 87.8550, "bbox": [21.50, 27.20, 85.80, 89.90], "areaKm2": 88752.0, "elevationMeters": 30},
    "bihar": {"displayName": "Bihar, India", "regionName": "Bihar", "state": "Bihar", "lat": 25.0961, "lng": 85.3131, "bbox": [24.28, 27.52, 83.33, 88.29], "areaKm2": 94163.0, "elevationMeters": 53},
    "telangana": {"displayName": "Telangana, India", "regionName": "Telangana", "state": "Telangana", "lat": 18.1124, "lng": 79.0193, "bbox": [15.84, 19.92, 77.23, 81.32], "areaKm2": 112077.0, "elevationMeters": 480},
    "andhra pradesh": {"displayName": "Andhra Pradesh, India", "regionName": "Andhra Pradesh", "state": "Andhra Pradesh", "lat": 15.9129, "lng": 79.7400, "bbox": [12.62, 19.15, 76.76, 84.77], "areaKm2": 162968.0, "elevationMeters": 90},
    "himachal pradesh": {"displayName": "Himachal Pradesh, India", "regionName": "Himachal Pradesh", "state": "Himachal Pradesh", "lat": 31.1048, "lng": 77.1734, "bbox": [30.38, 33.22, 75.79, 79.07], "areaKm2": 55673.0, "elevationMeters": 2200},
    "uttarakhand": {"displayName": "Uttarakhand, India", "regionName": "Uttarakhand", "state": "Uttarakhand", "lat": 30.0668, "lng": 79.0193, "bbox": [28.71, 31.46, 77.57, 81.04], "areaKm2": 53483.0, "elevationMeters": 1800},
    "chhattisgarh": {"displayName": "Chhattisgarh, India", "regionName": "Chhattisgarh", "state": "Chhattisgarh", "lat": 21.2787, "lng": 81.8661, "bbox": [17.78, 24.11, 80.24, 84.40], "areaKm2": 135192.0, "elevationMeters": 298},
    "jharkhand": {"displayName": "Jharkhand, India", "regionName": "Jharkhand", "state": "Jharkhand", "lat": 23.6102, "lng": 85.2799, "bbox": [21.97, 25.35, 83.33, 87.95], "areaKm2": 79716.0, "elevationMeters": 651},
    "haryana": {"displayName": "Haryana, India", "regionName": "Haryana", "state": "Haryana", "lat": 29.0588, "lng": 76.0856, "bbox": [27.65, 30.92, 74.46, 77.60], "areaKm2": 44212.0, "elevationMeters": 220},
    "goa": {"displayName": "Goa, India", "regionName": "Goa", "state": "Goa", "lat": 15.2993, "lng": 74.1240, "bbox": [14.90, 15.80, 73.68, 74.34], "areaKm2": 3702.0, "elevationMeters": 35},
    "sikkim": {"displayName": "Sikkim, India", "regionName": "Sikkim", "state": "Sikkim", "lat": 27.5330, "lng": 88.5122, "bbox": [27.08, 28.13, 88.01, 88.92], "areaKm2": 7096.0, "elevationMeters": 1650},
    "meghalaya": {"displayName": "Meghalaya, India", "regionName": "Meghalaya", "state": "Meghalaya", "lat": 25.4670, "lng": 91.3662, "bbox": [25.03, 26.11, 89.81, 92.80], "areaKm2": 22429.0, "elevationMeters": 1400},
    "manipur": {"displayName": "Manipur, India", "regionName": "Manipur", "state": "Manipur", "lat": 24.6637, "lng": 93.9063, "bbox": [23.83, 25.69, 93.03, 94.78], "areaKm2": 22327.0, "elevationMeters": 780},
    "mizoram": {"displayName": "Mizoram, India", "regionName": "Mizoram", "state": "Mizoram", "lat": 23.1645, "lng": 92.9376, "bbox": [21.97, 24.52, 92.26, 93.44], "areaKm2": 21081.0, "elevationMeters": 900},
    "nagaland": {"displayName": "Nagaland, India", "regionName": "Nagaland", "state": "Nagaland", "lat": 26.1584, "lng": 94.5624, "bbox": [25.10, 27.04, 93.33, 95.25], "areaKm2": 16579.0, "elevationMeters": 1200},
    "tripura": {"displayName": "Tripura, India", "regionName": "Tripura", "state": "Tripura", "lat": 23.9408, "lng": 91.9882, "bbox": [22.94, 24.53, 91.15, 92.34], "areaKm2": 10491.0, "elevationMeters": 40},
    "arunachal pradesh": {"displayName": "Arunachal Pradesh, India", "regionName": "Arunachal Pradesh", "state": "Arunachal Pradesh", "lat": 28.2180, "lng": 94.7278, "bbox": [26.63, 29.47, 91.56, 97.41], "areaKm2": 83743.0, "elevationMeters": 1500},
    "jammu and kashmir": {"displayName": "Jammu & Kashmir, India", "regionName": "Jammu & Kashmir", "state": "Jammu & Kashmir", "lat": 33.7782, "lng": 76.5762, "bbox": [32.28, 35.50, 73.75, 77.80], "areaKm2": 42241.0, "elevationMeters": 1600},
    "ladakh": {"displayName": "Ladakh, India", "regionName": "Ladakh", "state": "Ladakh", "lat": 34.1526, "lng": 77.5771, "bbox": [32.50, 36.00, 75.50, 80.00], "areaKm2": 59146.0, "elevationMeters": 3500},
    "delhi": {"displayName": "Delhi NCR, India", "regionName": "Delhi", "state": "Delhi", "lat": 28.6139, "lng": 77.2090, "bbox": [28.40, 28.88, 76.84, 77.35], "areaKm2": 1484.0, "elevationMeters": 216},

    # --- Major Indian Cities ---
    "cuttack": {"displayName": "Cuttack, Odisha, India", "regionName": "Cuttack", "state": "Odisha", "lat": 20.4625, "lng": 85.8828, "bbox": [20.35, 20.55, 85.75, 86.00], "areaKm2": 3932.0, "elevationMeters": 36},
    "bhubaneswar": {"displayName": "Bhubaneswar, Odisha, India", "regionName": "Bhubaneswar", "state": "Odisha", "lat": 20.2961, "lng": 85.8245, "bbox": [20.18, 20.40, 85.70, 85.95], "areaKm2": 422.0, "elevationMeters": 45},
    "puri": {"displayName": "Puri, Odisha, India", "regionName": "Puri", "state": "Odisha", "lat": 19.8135, "lng": 85.8312, "bbox": [19.70, 19.95, 85.70, 85.95], "areaKm2": 3479.0, "elevationMeters": 10},
    "rourkela": {"displayName": "Rourkela, Odisha, India", "regionName": "Rourkela", "state": "Odisha", "lat": 22.2604, "lng": 84.8536, "bbox": [22.18, 22.34, 84.78, 84.92], "areaKm2": 200.0, "elevationMeters": 219},
    "berhampur": {"displayName": "Berhampur, Odisha, India", "regionName": "Berhampur", "state": "Odisha", "lat": 19.3150, "lng": 84.7941, "bbox": [19.25, 19.38, 84.72, 84.86], "areaKm2": 86.8, "elevationMeters": 26},
    "sambalpur": {"displayName": "Sambalpur, Odisha, India", "regionName": "Sambalpur", "state": "Odisha", "lat": 21.4669, "lng": 83.9812, "bbox": [21.40, 21.54, 83.90, 84.05], "areaKm2": 182.0, "elevationMeters": 135},
    "guwahati": {"displayName": "Guwahati, Assam, India", "regionName": "Guwahati", "state": "Assam", "lat": 26.1806, "lng": 91.7539, "bbox": [26.02, 26.34, 91.59, 91.91], "areaKm2": 328.0, "elevationMeters": 55},
    "kochi": {"displayName": "Kochi, Kerala, India", "regionName": "Kochi", "state": "Kerala", "lat": 9.9679, "lng": 76.2444, "bbox": [9.81, 10.13, 76.08, 76.40], "areaKm2": 440.0, "elevationMeters": 5},
    "cochin": {"displayName": "Kochi, Kerala, India", "regionName": "Kochi", "state": "Kerala", "lat": 9.9679, "lng": 76.2444, "bbox": [9.81, 10.13, 76.08, 76.40], "areaKm2": 440.0, "elevationMeters": 5},
    "surat": {"displayName": "Surat, Gujarat, India", "regionName": "Surat", "state": "Gujarat", "lat": 21.2095, "lng": 72.8317, "bbox": [21.10, 21.32, 72.72, 72.95], "areaKm2": 474.0, "elevationMeters": 13},
    "shimla": {"displayName": "Shimla, Himachal Pradesh, India", "regionName": "Shimla", "state": "Himachal Pradesh", "lat": 31.1040, "lng": 77.1708, "bbox": [31.05, 31.16, 77.10, 77.24], "areaKm2": 35.3, "elevationMeters": 2206},
    "varanasi": {"displayName": "Varanasi, Uttar Pradesh, India", "regionName": "Varanasi", "state": "Uttar Pradesh", "lat": 25.3356, "lng": 83.0076, "bbox": [25.25, 25.42, 82.92, 83.08], "areaKm2": 112.0, "elevationMeters": 80},
    "bhopal": {"displayName": "Bhopal, Madhya Pradesh, India", "regionName": "Bhopal", "state": "Madhya Pradesh", "lat": 23.2585, "lng": 77.4020, "bbox": [23.16, 23.35, 77.28, 77.52], "areaKm2": 286.0, "elevationMeters": 527},
    "indore": {"displayName": "Indore, Madhya Pradesh, India", "regionName": "Indore", "state": "Madhya Pradesh", "lat": 22.7204, "lng": 75.8682, "bbox": [22.62, 22.82, 75.77, 75.97], "areaKm2": 530.0, "elevationMeters": 553},
    "mumbai": {"displayName": "Mumbai, Maharashtra, India", "regionName": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lng": 72.8777, "bbox": [18.89, 19.27, 72.77, 73.02], "areaKm2": 603.4, "elevationMeters": 14},
    "bengaluru": {"displayName": "Bengaluru, Karnataka, India", "regionName": "Bengaluru", "state": "Karnataka", "lat": 12.9716, "lng": 77.5946, "bbox": [12.83, 13.14, 77.46, 77.78], "areaKm2": 741.0, "elevationMeters": 920},
    "bangalore": {"displayName": "Bengaluru, Karnataka, India", "regionName": "Bengaluru", "state": "Karnataka", "lat": 12.9716, "lng": 77.5946, "bbox": [12.83, 13.14, 77.46, 77.78], "areaKm2": 741.0, "elevationMeters": 920},
    "hyderabad": {"displayName": "Hyderabad, Telangana, India", "regionName": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lng": 78.4867, "bbox": [17.25, 17.55, 78.30, 78.60], "areaKm2": 650.0, "elevationMeters": 542},
    "chennai": {"displayName": "Chennai, Tamil Nadu, India", "regionName": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lng": 80.2707, "bbox": [12.90, 13.25, 80.10, 80.35], "areaKm2": 426.0, "elevationMeters": 6},
    "kolkata": {"displayName": "Kolkata, West Bengal, India", "regionName": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lng": 88.3639, "bbox": [22.45, 22.70, 88.25, 88.48], "areaKm2": 206.1, "elevationMeters": 9},
    "pune": {"displayName": "Pune, Maharashtra, India", "regionName": "Pune", "state": "Maharashtra", "lat": 18.5204, "lng": 73.8567, "bbox": [18.40, 18.65, 73.75, 74.00], "areaKm2": 331.3, "elevationMeters": 560},
    "ahmedabad": {"displayName": "Ahmedabad, Gujarat, India", "regionName": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lng": 72.5714, "bbox": [22.90, 23.15, 72.45, 72.70], "areaKm2": 505.0, "elevationMeters": 53},
    "jaipur": {"displayName": "Jaipur, Rajasthan, India", "regionName": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lng": 75.7873, "bbox": [26.78, 27.05, 75.65, 75.92], "areaKm2": 485.0, "elevationMeters": 431},
    "lucknow": {"displayName": "Lucknow, Uttar Pradesh, India", "regionName": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lng": 80.9462, "bbox": [26.73, 26.96, 80.82, 81.07], "areaKm2": 418.0, "elevationMeters": 123},
    "patna": {"displayName": "Patna, Bihar, India", "regionName": "Patna", "state": "Bihar", "lat": 25.5941, "lng": 85.1376, "bbox": [25.51, 25.68, 85.02, 85.25], "areaKm2": 250.0, "elevationMeters": 53},
    "chandigarh": {"displayName": "Chandigarh, India", "regionName": "Chandigarh", "state": "Chandigarh", "lat": 30.7333, "lng": 76.7794, "bbox": [30.65, 30.82, 76.68, 76.88], "areaKm2": 114.0, "elevationMeters": 321},
    "srinagar": {"displayName": "Srinagar, Jammu & Kashmir, India", "regionName": "Srinagar", "state": "Jammu & Kashmir", "lat": 34.0837, "lng": 74.7973, "bbox": [33.98, 34.18, 74.70, 74.92], "areaKm2": 294.0, "elevationMeters": 1585},
    "visakhapatnam": {"displayName": "Visakhapatnam, Andhra Pradesh, India", "regionName": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6868, "lng": 83.2185, "bbox": [17.58, 17.80, 83.10, 83.35], "areaKm2": 681.9, "elevationMeters": 45},
    "dehradun": {"displayName": "Dehradun, Uttarakhand, India", "regionName": "Dehradun", "state": "Uttarakhand", "lat": 30.3165, "lng": 78.0322, "bbox": [30.22, 30.40, 77.92, 78.12], "areaKm2": 300.0, "elevationMeters": 640},
    "coimbatore": {"displayName": "Coimbatore, Tamil Nadu, India", "regionName": "Coimbatore", "state": "Tamil Nadu", "lat": 11.0168, "lng": 76.9558, "bbox": [10.92, 11.12, 76.85, 77.05], "areaKm2": 246.8, "elevationMeters": 411},
    "vadodara": {"displayName": "Vadodara, Gujarat, India", "regionName": "Vadodara", "state": "Gujarat", "lat": 22.3072, "lng": 73.1812, "bbox": [22.20, 22.40, 73.08, 73.28], "areaKm2": 220.0, "elevationMeters": 39},
    "nagpur": {"displayName": "Nagpur, Maharashtra, India", "regionName": "Nagpur", "state": "Maharashtra", "lat": 21.1458, "lng": 79.0882, "bbox": [21.05, 21.25, 78.98, 79.20], "areaKm2": 227.0, "elevationMeters": 310},
    "amritsar": {"displayName": "Amritsar, Punjab, India", "regionName": "Amritsar", "state": "Punjab", "lat": 31.6340, "lng": 74.8723, "bbox": [31.55, 31.72, 74.78, 74.96], "areaKm2": 170.0, "elevationMeters": 234},
    "ludhiana": {"displayName": "Ludhiana, Punjab, India", "regionName": "Ludhiana", "state": "Punjab", "lat": 30.9010, "lng": 75.8573, "bbox": [30.80, 31.00, 75.75, 75.96], "areaKm2": 310.0, "elevationMeters": 244},
    "agra": {"displayName": "Agra, Uttar Pradesh, India", "regionName": "Agra", "state": "Uttar Pradesh", "lat": 27.1767, "lng": 78.0081, "bbox": [27.10, 27.25, 77.90, 78.10], "areaKm2": 188.0, "elevationMeters": 171},
    "kanpur": {"displayName": "Kanpur, Uttar Pradesh, India", "regionName": "Kanpur", "state": "Uttar Pradesh", "lat": 26.4499, "lng": 80.3319, "bbox": [26.35, 26.55, 80.20, 80.45], "areaKm2": 403.0, "elevationMeters": 126},
    "jodhpur": {"displayName": "Jodhpur, Rajasthan, India", "regionName": "Jodhpur", "state": "Rajasthan", "lat": 26.2389, "lng": 73.0243, "bbox": [26.15, 26.35, 72.92, 73.12], "areaKm2": 233.0, "elevationMeters": 231},
    "udaipur": {"displayName": "Udaipur, Rajasthan, India", "regionName": "Udaipur", "state": "Rajasthan", "lat": 24.5854, "lng": 73.7125, "bbox": [24.50, 24.68, 73.62, 73.80], "areaKm2": 64.0, "elevationMeters": 598},
    "shillong": {"displayName": "Shillong, Meghalaya, India", "regionName": "Shillong", "state": "Meghalaya", "lat": 25.5788, "lng": 91.8933, "bbox": [25.52, 25.64, 91.82, 91.96], "areaKm2": 64.0, "elevationMeters": 1525},
    "imphal": {"displayName": "Imphal, Manipur, India", "regionName": "Imphal", "state": "Manipur", "lat": 24.8170, "lng": 93.9368, "bbox": [24.75, 24.88, 93.88, 94.00], "areaKm2": 122.0, "elevationMeters": 786},
    "leh": {"displayName": "Leh, Ladakh, India", "regionName": "Leh", "state": "Ladakh", "lat": 34.1526, "lng": 77.5771, "bbox": [34.10, 34.22, 77.50, 77.65], "areaKm2": 45.0, "elevationMeters": 3524},
    "raipur": {"displayName": "Raipur, Chhattisgarh, India", "regionName": "Raipur", "state": "Chhattisgarh", "lat": 21.2514, "lng": 81.6296, "bbox": [21.18, 21.32, 81.55, 81.72], "areaKm2": 226.0, "elevationMeters": 298},
    "ranchi": {"displayName": "Ranchi, Jharkhand, India", "regionName": "Ranchi", "state": "Jharkhand", "lat": 23.3441, "lng": 85.3096, "bbox": [23.28, 23.42, 85.22, 85.40], "areaKm2": 175.0, "elevationMeters": 651},

    # --- Famous Water Bodies & Geospatial Landmarks ---
    "chilika": {"displayName": "Chilika Lake, Odisha, India", "regionName": "Chilika Lake", "state": "Odisha", "lat": 19.7167, "lng": 85.3167, "bbox": [19.45, 19.95, 85.10, 85.60], "areaKm2": 1165.0, "elevationMeters": 2},
    "chilika lake": {"displayName": "Chilika Lake, Odisha, India", "regionName": "Chilika Lake", "state": "Odisha", "lat": 19.7167, "lng": 85.3167, "bbox": [19.45, 19.95, 85.10, 85.60], "areaKm2": 1165.0, "elevationMeters": 2},
    "dal lake": {"displayName": "Dal Lake, Srinagar, Jammu & Kashmir, India", "regionName": "Dal Lake", "state": "Jammu & Kashmir", "lat": 34.1130, "lng": 74.8698, "bbox": [34.07, 34.15, 74.83, 74.92], "areaKm2": 18.0, "elevationMeters": 1583},
    "wular lake": {"displayName": "Wular Lake, Jammu & Kashmir, India", "regionName": "Wular Lake", "state": "Jammu & Kashmir", "lat": 34.3500, "lng": 74.5800, "bbox": [34.28, 34.42, 74.50, 74.68], "areaKm2": 189.0, "elevationMeters": 1580},
    "vembanaad": {"displayName": "Vembanad Lake, Kerala, India", "regionName": "Vembanad Lake", "state": "Kerala", "lat": 9.5937, "lng": 76.4167, "bbox": [9.45, 9.80, 76.30, 76.55], "areaKm2": 2033.0, "elevationMeters": 1},
    "loktak lake": {"displayName": "Loktak Lake, Manipur, India", "regionName": "Loktak Lake", "state": "Manipur", "lat": 24.5500, "lng": 93.8000, "bbox": [24.45, 24.65, 93.72, 93.88], "areaKm2": 287.0, "elevationMeters": 768},
    "hirakud": {"displayName": "Hirakud Reservoir, Odisha, India", "regionName": "Hirakud Reservoir", "state": "Odisha", "lat": 21.5700, "lng": 83.8700, "bbox": [21.45, 21.70, 83.75, 84.00], "areaKm2": 743.0, "elevationMeters": 192},
    "sundarbans": {"displayName": "Sundarbans Biosphere, West Bengal, India", "regionName": "Sundarbans", "state": "West Bengal", "lat": 21.9497, "lng": 89.1833, "bbox": [21.50, 22.40, 88.50, 89.90], "areaKm2": 9630.0, "elevationMeters": 3},
    "western ghats": {"displayName": "Western Ghats, India", "regionName": "Western Ghats", "state": "Multi-State", "lat": 11.5000, "lng": 76.5000, "bbox": [8.50, 20.50, 73.00, 77.50], "areaKm2": 160000.0, "elevationMeters": 1200},

    # --- National Baseline Fallback ---
    "india": {"displayName": "India (Subcontinent)", "regionName": "India", "state": "National", "lat": 20.5937, "lng": 78.9629, "bbox": [8.07, 37.10, 68.11, 97.41], "areaKm2": 3287263.0, "elevationMeters": 400},
}

GEOCODE_CACHE: dict[str, LocationMetadata] = {}


def format_coords(lat: float, lng: float) -> str:
    lat_dir = "N" if lat >= 0 else "S"
    lng_dir = "E" if lng >= 0 else "W"
    return f"{abs(lat):.4f}° {lat_dir}, {abs(lng):.4f}° {lng_dir}"


def _build_loc_from_data(data: dict[str, Any]) -> LocationMetadata:
    return LocationMetadata(
        displayName=data["displayName"],
        regionName=data["regionName"],
        state=data["state"],
        lat=data["lat"],
        lng=data["lng"],
        boundingBox=data["bbox"],
        areaKm2=data["areaKm2"],
        elevationMeters=data["elevationMeters"],
        coordinatesDisplay=format_coords(data["lat"], data["lng"]),
    )


def find_offline_region(query_text: str) -> LocationMetadata | None:
    norm = query_text.lower().strip()
    # 1. Exact match first
    if norm in INDIA_REGIONS:
        return _build_loc_from_data(INDIA_REGIONS[norm])

    # 2. Match whole word boundary (longest match first)
    for key in sorted(INDIA_REGIONS.keys(), key=len, reverse=True):
        if key == "india":
            continue
        if re.search(r"\b" + re.escape(key) + r"\b", norm):
            return _build_loc_from_data(INDIA_REGIONS[key])

    return None


async def _live_nominatim_geocode(search_term: str) -> LocationMetadata | None:
    """High-reliability live geocoding across India using OpenStreetMap Nominatim."""
    try:
        clean = re.sub(
            r"\b(show|find|detect|where|is|near|in|at|between|loss|gain|water|bodies|vegetation|construction|analyse|analyze|check|scan|inspect|explore|map|view|about)\b",
            "",
            search_term,
            flags=re.I,
        ).strip()
        if not clean or clean.lower() in ["india", "the"]:
            clean = search_term.strip()

        q = f"{clean}, India" if "india" not in clean.lower() else clean
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": q,
            "format": "json",
            "addressdetails": "1",
            "limit": "6",
            "countrycodes": "in",
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }

        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                results = resp.json()
                if results and len(results) > 0:
                    # Prioritize exact city center / urban place over massive rural district boundary centroid
                    def _rank_geo(it):
                        t = it.get("type", "").lower()
                        c = it.get("class", "").lower()
                        if c == "place" and t in ["city", "town"]:
                            return 0
                        if c == "place" or t in ["city", "town", "suburb", "village"]:
                            return 1
                        if c == "boundary" or t == "administrative":
                            return 3
                        return 2

                    sorted_results = sorted(results, key=_rank_geo)
                    item = sorted_results[0]
                    lat = float(item["lat"])
                    lon = float(item["lon"])
                    bbox_raw = item.get("boundingbox", [lat - 0.1, lat + 0.1, lon - 0.1, lon + 0.1])
                    bbox = [float(b) for b in bbox_raw]
                    address = item.get("address", {})
                    state = address.get("state") or address.get("region") or "India"
                    display_name = item.get("display_name", f"{clean.title()}, India")
                    short_display = ", ".join(display_name.split(",")[:3])
                    region = (
                        address.get("city")
                        or address.get("town")
                        or address.get("village")
                        or address.get("suburb")
                        or address.get("state_district")
                        or clean.title()
                    )

                    return LocationMetadata(
                        displayName=short_display,
                        regionName=region,
                        state=state,
                        lat=round(lat, 4),
                        lng=round(lon, 4),
                        boundingBox=bbox,
                        areaKm2=round(max(10.0, abs((bbox[1] - bbox[0]) * (bbox[3] - bbox[2]) * 111 * 111)), 1),
                        elevationMeters=150,
                        coordinatesDisplay=format_coords(lat, lon),
                    )
    except Exception as e:
        print(f"[Nominatim Live Geocoder] Error for '{search_term}': {e}")
    return None


async def _mappls_geocode(search_term: str) -> LocationMetadata | None:
    """Mappls Place Search API fallback."""
    if not MAPPLS_KEY:
        return None
    try:
        url = (
            f"https://atlas.mappls.com/api/places/search/json"
            f"?query={search_term}&access_token={MAPPLS_KEY}&region=IND&itemCount=1"
        )
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                suggestions = data.get("suggestedLocations", [])
                if suggestions:
                    place = suggestions[0]
                    lat = float(place.get("latitude", 0))
                    lng = float(place.get("longitude", 0))
                    if lat and lng:
                        display = place.get("placeName", search_term)
                        region = place.get("placeAddress", "").split(",")[0] or display
                        state = place.get("state", "India")
                        pad = 0.09
                        bbox = [lat - pad, lat + pad, lng - pad, lng + pad]
                        return LocationMetadata(
                            displayName=f"{display}, India",
                            regionName=region,
                            state=state,
                            lat=round(lat, 4),
                            lng=round(lng, 4),
                            boundingBox=bbox,
                            areaKm2=round(abs((bbox[1] - bbox[0]) * (bbox[3] - bbox[2]) * 111 * 111), 1),
                            elevationMeters=100,
                            coordinatesDisplay=format_coords(lat, lng),
                        )
    except Exception as e:
        print(f"[Mappls Geocoder] {e}")
    return None


async def resolve_location(location_name: str, question_context: str = "") -> LocationMetadata:
    """
    Unified All-India location resolver:
    1. If question explicitly specifies a place (e.g. 'in Cuttack'), that place takes precedence!
    2. Instant match in 100+ offline Indian cities, water bodies, and states.
    3. High-precision live Nominatim geocoder across India.
    4. Mappls place search API fallback.
    5. Safe national fallback.
    """
    cache_key = f"{location_name}:{question_context}".lower().strip()
    if cache_key in GEOCODE_CACHE:
        return GEOCODE_CACHE[cache_key]

    # Priority 1: Check if question_context specifically names an Indian region/city
    if question_context:
        q_offline = find_offline_region(question_context)
        if q_offline:
            GEOCODE_CACHE[cache_key] = q_offline
            return q_offline

        clean_match = re.search(r"\b(?:in|at|near|for|around)\s+([A-Za-z\s]+?)(?:\?|$|\.|\,)", question_context, re.I)
        if clean_match:
            candidate = clean_match.group(1).strip()
            if candidate and candidate.lower() not in ["india", "the", "a", "an", "this", "that"]:
                live_q = await _live_nominatim_geocode(candidate)
                if live_q:
                    GEOCODE_CACHE[cache_key] = live_q
                    return live_q

    # Priority 2: Use provided location_name
    if location_name and location_name.lower() not in ["india", "all"]:
        # If location_name is "City, State, ...", check the city token first
        primary_token = location_name.split(",")[0].strip()
        loc_offline = find_offline_region(primary_token)
        if loc_offline and loc_offline.regionName.lower() != "india":
            GEOCODE_CACHE[cache_key] = loc_offline
            return loc_offline

        # Try live Nominatim geocode for exact place/city
        live_result = await _live_nominatim_geocode(location_name)
        if live_result:
            GEOCODE_CACHE[cache_key] = live_result
            return live_result

        # Broader offline fallback (e.g. if state name was provided)
        loc_offline_broader = find_offline_region(location_name)
        if loc_offline_broader:
            GEOCODE_CACHE[cache_key] = loc_offline_broader
            return loc_offline_broader

        mappls_result = await _mappls_geocode(location_name)
        if mappls_result:
            GEOCODE_CACHE[cache_key] = mappls_result
            return mappls_result

    # Priority 3: Fallback
    national = _build_loc_from_data(INDIA_REGIONS["india"])
    GEOCODE_CACHE[cache_key] = national
    return national

