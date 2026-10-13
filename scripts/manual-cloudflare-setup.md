# Manual Cloudflare Access Bypass Setup

Since API token is not working, here's how to manually configure bypass policies:

## Step 1: Access Cloudflare Dashboard

1. Go to: https://one.dash.cloudflare.com/
2. Login with your Cloudflare account
3. Select your account

## Step 2: Navigate to Access Application

1. Click on **Zero Trust** in the left menu
2. Click on **Access** → **Applications**
3. Find and click on `api.nemaone.com` application

## Step 3: Create Bypass Policy

1. In the application settings, click on **Policies** tab
2. Click **Add a policy**
3. Configure the policy:

### Policy Details:
- **Policy name**: `Public API Endpoints`
- **Action**: **Bypass** (not Allow)
- **Precedence**: `1` (highest priority)

### Include Section:
- Click **Add include**
- Select **Everyone** (this allows everyone to bypass)

### Connection Criteria (Optional but Recommended):
Click **Add criteria** → **Path** for each endpoint:
- **Path**: `/products` → **Operator**: `starts with`
- **Path**: `/categories` → **Operator**: `starts with`
- **Path**: `/reviews` → **Operator**: `starts with`
- **Path**: `/sliding-cards` → **Operator**: `starts with`
- **Path**: `/site-images` → **Operator**: `starts with`

4. Click **Save**

## Step 4: Test the Configuration

After saving, test these URLs in your browser:
- https://api.nemaone.com/categories
- https://api.nemaone.com/products

They should return JSON data without requiring login.

## Step 5: Update Frontend Code

Once bypass is working, I'll update the Header component to use direct worker calls.

## Alternative: Use Cloudflare Access Service Tokens

If the above doesn't work, you can create Service Tokens:

1. **Access** → **Service Auth** → **Service Tokens**
2. Create a new service token
3. Add the token to your frontend calls

But the bypass approach is better for public endpoints.

---

Let me know once you've configured the bypass policies, and I'll update the frontend code accordingly.
