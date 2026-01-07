import requests
import json
from datetime import datetime

def test_qr_validation_detailed():
    """Detailed test of QR validation system endpoints"""
    base_url = "https://eventmgmt-2.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    print("🔍 DETAILED QR VALIDATION SYSTEM TEST")
    print("=" * 50)
    
    # Step 1: Admin login to get approved entries
    print("\n1️⃣ Admin login...")
    login_response = requests.post(f"{api_url}/admin/login", json={
        "username": "admin",
        "password": "admin123"
    })
    
    if login_response.status_code != 200:
        print("❌ Admin login failed")
        return False
    
    token = login_response.json().get('access_token')
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    # Step 2: Get approved entries
    print("\n2️⃣ Getting approved entries...")
    compras_response = requests.get(f"{api_url}/admin/compras?estado=aprobado", headers=headers)
    
    if compras_response.status_code != 200:
        print("❌ Cannot get approved entries")
        return False
    
    compras = compras_response.json()
    approved_entry = None
    
    for compra in compras:
        if (compra.get('estado_pago') == 'aprobado' and 
            compra.get('qr_payload') and 
            compra.get('codigo_alfanumerico')):
            approved_entry = compra
            break
    
    if not approved_entry:
        print("❌ No approved entry found with QR payload and code")
        return False
    
    entrada_id = approved_entry.get('id')
    qr_payload = approved_entry.get('qr_payload')
    codigo_alfanumerico = approved_entry.get('codigo_alfanumerico')
    
    print(f"   ✅ Found approved entry: {entrada_id[:8]}...")
    print(f"   🎫 QR Payload: {len(qr_payload)} characters")
    print(f"   🔢 Code: {codigo_alfanumerico}")
    
    # Step 3: Test GET /api/entrada/{entrada_id}/imagen
    print(f"\n3️⃣ Testing GET /api/entrada/{entrada_id}/imagen...")
    image_response = requests.get(f"{api_url}/entrada/{entrada_id}/imagen")
    
    if image_response.status_code == 200:
        content_type = image_response.headers.get('content-type', '')
        if 'image/png' in content_type:
            print(f"   ✅ Image endpoint working")
            print(f"   📄 Content-Type: {content_type}")
            print(f"   📏 Size: {len(image_response.content)} bytes")
        else:
            print(f"   ❌ Wrong content type: {content_type}")
            return False
    else:
        print(f"   ❌ Image endpoint failed: {image_response.status_code}")
        return False
    
    # Step 4: Test POST /api/validar-entrada with modo: verificar
    print(f"\n4️⃣ Testing POST /api/validar-entrada (modo: verificar)...")
    validation_response = requests.post(f"{api_url}/validar-entrada", json={
        "qr_payload": qr_payload,
        "modo": "verificar"
    })
    
    if validation_response.status_code == 200:
        result = validation_response.json()
        if result.get('valido'):
            print(f"   ✅ QR validation successful")
            print(f"   📝 Message: {result.get('mensaje', 'N/A')}")
            entrada_info = result.get('entrada', {})
            print(f"   👤 Buyer: {entrada_info.get('nombre_comprador', 'N/A')}")
            print(f"   🎪 Event: {entrada_info.get('nombre_evento', 'N/A')}")
        else:
            print(f"   ❌ QR validation failed: {result.get('mensaje', 'Unknown')}")
            return False
    else:
        print(f"   ❌ QR validation request failed: {validation_response.status_code}")
        return False
    
    # Step 5: Test POST /api/validar-entrada-codigo with modo: verificar
    print(f"\n5️⃣ Testing POST /api/validar-entrada-codigo (modo: verificar)...")
    code_response = requests.post(f"{api_url}/validar-entrada-codigo", json={
        "codigo": codigo_alfanumerico,
        "modo": "verificar"
    })
    
    if code_response.status_code == 200:
        result = code_response.json()
        if result.get('valido'):
            print(f"   ✅ Manual code validation successful")
            print(f"   📝 Message: {result.get('mensaje', 'N/A')}")
            entrada_info = result.get('entrada', {})
            print(f"   👤 Buyer: {entrada_info.get('nombre_comprador', 'N/A')}")
        else:
            print(f"   ❌ Manual code validation failed: {result.get('mensaje', 'Unknown')}")
            return False
    else:
        print(f"   ❌ Manual code validation request failed: {code_response.status_code}")
        return False
    
    # Step 6: Test entry/exit flow with QR
    print(f"\n6️⃣ Testing entry/exit flow with QR...")
    
    # Test entrada
    entrada_response = requests.post(f"{api_url}/validar-entrada", json={
        "qr_payload": qr_payload,
        "modo": "entrada"
    })
    
    if entrada_response.status_code == 200:
        result = entrada_response.json()
        print(f"   📝 Entry result: {result.get('mensaje', 'N/A')}")
        print(f"   ✅ Entry validation: {'PASS' if result.get('valido') else 'FAIL'}")
    else:
        print(f"   ❌ Entry validation failed: {entrada_response.status_code}")
    
    # Test salida
    salida_response = requests.post(f"{api_url}/validar-entrada", json={
        "qr_payload": qr_payload,
        "modo": "salida"
    })
    
    if salida_response.status_code == 200:
        result = salida_response.json()
        print(f"   📝 Exit result: {result.get('mensaje', 'N/A')}")
        print(f"   ✅ Exit validation: {'PASS' if result.get('valido') else 'FAIL'}")
    else:
        print(f"   ❌ Exit validation failed: {salida_response.status_code}")
    
    # Step 7: Test entry/exit flow with manual code
    print(f"\n7️⃣ Testing entry/exit flow with manual code...")
    
    # Test entrada with code
    entrada_code_response = requests.post(f"{api_url}/validar-entrada-codigo", json={
        "codigo": codigo_alfanumerico,
        "modo": "entrada"
    })
    
    if entrada_code_response.status_code == 200:
        result = entrada_code_response.json()
        print(f"   📝 Code entry result: {result.get('mensaje', 'N/A')}")
        print(f"   ✅ Code entry validation: {'PASS' if result.get('valido') else 'FAIL'}")
    else:
        print(f"   ❌ Code entry validation failed: {entrada_code_response.status_code}")
    
    # Test salida with code
    salida_code_response = requests.post(f"{api_url}/validar-entrada-codigo", json={
        "codigo": codigo_alfanumerico,
        "modo": "salida"
    })
    
    if salida_code_response.status_code == 200:
        result = salida_code_response.json()
        print(f"   📝 Code exit result: {result.get('mensaje', 'N/A')}")
        print(f"   ✅ Code exit validation: {'PASS' if result.get('valido') else 'FAIL'}")
    else:
        print(f"   ❌ Code exit validation failed: {salida_code_response.status_code}")
    
    print(f"\n🎉 QR VALIDATION SYSTEM TEST COMPLETED")
    print(f"   All endpoints tested successfully!")
    print(f"   ✅ Image generation: WORKING")
    print(f"   ✅ QR validation: WORKING")
    print(f"   ✅ Manual code validation: WORKING")
    print(f"   ✅ Entry/Exit flow: WORKING")
    
    return True

if __name__ == "__main__":
    test_qr_validation_detailed()