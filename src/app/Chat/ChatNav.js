"use client";

import React, { useState } from "react";
import { Popover } from "@headlessui/react";
import Popup from "../components/sub-components/Popup.js";
import UserCard from "../components/UserCard.js";

export default function ChatNav({ messages, session }) {
	const [searchInput, setSearchInput] = useState("");
	const [searchResults, setSearchResult] = useState([]);
	const [popUp, setPopUp] = useState(false);

	const handleSave = () => {
		// send fetch to db

		const body = { email: session.user.email, name: session.user.name, messages: messages };
		const send = JSON.stringify(body);

		fetch("/api/chats", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: send,
		});
	};

	const handlePopUp = () => {
		setPopUp(!popUp);
	};

	return (
		<div>
			<nav className='flex justify-between'>
				<div>
					<UserCard />
				</div>
			</nav>
		</div>
	);
}
