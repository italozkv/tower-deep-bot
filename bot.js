local ReplicatedStorage = game:GetService("ReplicatedStorage")

local connected = false

local function connectDrain(remote)
	if connected then
		return
	end
	if not remote or not remote:IsA("RemoteEvent") then
		return
	end
	connected = true
	remote.OnClientEvent:Connect(function(_payload)
		-- Drain fallback listener: avoids queue exhaustion when lobby UI script is not active.
	end)
end

local function bindInFolder(folder)
	if not folder then
		return
	end

	local existing = folder:FindFirstChild("LobbyAreaBroadcast")
	if existing then
		connectDrain(existing)
	end

	folder.ChildAdded:Connect(function(child)
		if child.Name == "LobbyAreaBroadcast" then
			connectDrain(child)
		end
	end)
end

local remotesRoot = ReplicatedStorage:WaitForChild("Remotes")
bindInFolder(remotesRoot)

local nested = remotesRoot:FindFirstChild("Remotes")
if nested and nested:IsA("Folder") then
	bindInFolder(nested)
end

remotesRoot.ChildAdded:Connect(function(child)
	if child.Name == "Remotes" and child:IsA("Folder") then
		bindInFolder(child)
	end
end)
