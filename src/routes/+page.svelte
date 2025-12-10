<script>
	import { resolve } from '$app/paths';
</script>

<h1>Välkommen!</h1>
<p>Utforska våra forum och delta i diskussionerna!</p>
<a href={resolve('/forums')}>Tillbaka till forumen</a>
<p class="note">(Tryck på meddelanden för att kunna uppdatera dem)</p>

<style>
	h1 {
		font-size: 3.5rem;
		margin-bottom: 1.5rem;
		color: #2c3e50;
		font-weight: 800;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	p {
		font-size: 1.2rem;
		margin: 1rem 0;
		color: #4a5568;
		line-height: 1.6;
	}

	p.note {
		font-size: 0.9rem;
		color: #718096;
		margin-top: 2rem;
		font-style: italic;
	}

	a {
		display: inline-block;
		margin-top: 2rem;
		padding: 1rem 2.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		text-decoration: none;
		border-radius: 50px;
		font-weight: 700;
		font-size: 1.1rem;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
	}

	a:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
	}
</style>
