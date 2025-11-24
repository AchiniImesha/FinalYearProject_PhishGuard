from flask import Blueprint, request, jsonify, redirect, url_for, session
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import json

from ..controllers.user_controller import UserController
from ..middleware.auth import token_required

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Google OAuth Configuration
GOOGLE_CLIENT_ID = ""
GOOGLE_CLIENT_SECRET = ""
GOOGLE_REDIRECT_URI = ""
GOOGLE_AUTH_URL = ""
GOOGLE_TOKEN_URL = ""
GOOGLE_USERINFO_URL = ""

# Register routes
@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    return UserController.register()

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login a user"""
    return UserController.login()

@auth_bp.route('/google/url', methods=['GET'])
def google_auth_url():
    """Get Google OAuth URL"""
    try:
        # Create the authorization URL
        auth_url = f"{GOOGLE_AUTH_URL}?client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile&access_type=offline"
        return jsonify({"auth_url": auth_url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/google/callback', methods=['POST'])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        data = request.get_json()
        code = data.get('code')
        
        if not code:
            return jsonify({"error": "Authorization code is required"}), 400
        
        # Exchange authorization code for access token
        token_data = {
            'client_id': GOOGLE_CLIENT_ID,
            'client_secret': GOOGLE_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': GOOGLE_REDIRECT_URI
        }
        
        token_response = requests.post(GOOGLE_TOKEN_URL, data=token_data)
        token_response.raise_for_status()
        token_info = token_response.json()
        
        access_token = token_info.get('access_token')
        if not access_token:
            return jsonify({"error": "Failed to get access token"}), 400
        
        # Get user information from Google
        headers = {'Authorization': f'Bearer {access_token}'}
        userinfo_response = requests.get(GOOGLE_USERINFO_URL, headers=headers)
        userinfo_response.raise_for_status()
        userinfo = userinfo_response.json()
        
        # Extract user information
        google_id = userinfo.get('id')
        email = userinfo.get('email')
        first_name = userinfo.get('given_name', '')
        last_name = userinfo.get('family_name', '')
        name = userinfo.get('name', '')
        picture = userinfo.get('picture', '')
        
        if not email:
            return jsonify({"error": "Email is required from Google"}), 400
        
        # Handle user registration/login
        return UserController.handle_google_auth(google_id, email, first_name, last_name, name, picture)
        
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Google API error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/user/<user_id>', methods=['GET'])
@token_required
def get_user(current_user, user_id):
    """Get a user by ID"""
    return UserController.get_user(current_user, user_id)

@auth_bp.route('/user/<user_id>', methods=['PUT'])
@token_required
def update_user(current_user, user_id):
    """Update a user"""
    return UserController.update_user(current_user, user_id)

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get the current user"""
    return UserController.get_user(current_user, current_user['id'])

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """Refresh access token"""
    return UserController.refresh_token() 