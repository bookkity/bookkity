---
url: "toward-functional-paradigm-fundamental-concepts-in-java"
date: "2024-06-20"
author: "crejk"
language: "en"
title: "Toward Functional Paradigm: Fundamental Concepts in Java"
image: "/0002/fp-aristarchusnull.jpg"
tags: ["java"]
---

## Introduction
As Java Developers, we are pretty familiar with OOP, because we obviously use object-oriented programming language, but that doesn't mean we can't draw from other paradigms, and can't combine them together.
Functional Programming is paradigm that emphasizes the use of immutability, pure functions, and expressions over statements. TU COS MOZE TEZ DOPISAC
We will dig into the basics and explore how we can benefit from them as a Java developer.

### Immutability
The primary concept with which we may already be familiar is immutability.

#### Immutable objects
Immutable objects, once created, cannot be modified. They remain the same throughout their entire life cycle.

```java
// old fashion way
public class User {
    
    private final String username;
    private final int age;
    
    public User(String username, int age) {
        this.username = username;
        this.age = age;
    }
    
    // getters
    // equals & hashCode
}
```

For years, Java ha not had a decent built-in way of defining immutable objects, but we lived to see records.

```java
// Java 14+
public record User(String username, int age) {
}
```
<References links={[
{ title: "Record Classes", url: "https://docs.oracle.com/en/java/javase/17/language/records.html" },
]} />

The following code doesn't allow us any modification, the only way to "update" the object is to create new one with changed values.

```java
public record Reservation(ReservationId id, Status status) {

    Reservation cancel() {
        return new Reservation(id, Status.Cancelled);
    }
}
```

Unfortunately, in Java we have to do it manually. In comparison, Kotlin provides us `copy` method.

```kotlin
data class Reservation(val id: ReservationId, val status: Status) {
    
    fun cancel(): Reservation  =
        copy(status = Status.Cancelled)
}
```

What are main benefits of using immutable objects?
- immutable objects are thread-safe, they can be shared among multiple threads without restraint.
- allows you to reason about a piece of code independently of the rest of the program, because our internal state can't be changed by other part of our system.
- we can model things like they are, e.g. events - the fact already happened we can't change past.

```java
    public void handle(MoneyTransfered moneyTransfered) {
        moneyTransfered.setAmount(BigDecimal.valueOf(0)); // WTF?
    }
```

#### Immutable collections
Problem with mutable collection

```java
    ShowStats getShowStats(List<Reservation> reservations) {
        int activeReservations = calculateActiveReservations(reservations);
        int totalReservations = reservations.size();
        return new ShowStats(activeReservations, totalReservations);
    }
```

On the first look it looks fine, but what in case `activeReservations()` removes some elements from provided list?

```java
    public int calculateActiveReservations(List<Reservations> reservations) {
        reservations.removeIf(reservation -> reservation.getStatus() != Status.Active);
        return reservations.size();
    }
```

If we pass an ArrayList the `calculateActiveReservations` will modify the list and that will cause a bug

```java
    ShowStats getShowStats(List<Reservation> reservations){ // [Reservation[status=Active], Reservation[status=Active], Reservation[status=Cancelled]]
        int activeReservations = calculateActiveReservations(reservations); // 2
        // reservations = [Reservation[status=Active], Reservation[status=Active]]
        int totalReservations = reservations.size(); // 2
        return new ShowStats(activeReservations, totalReservations);
    }
```

If we created list using `List.of()` or `Stream#toList()` it created `ImmutableCollections.List`, which doesn't allow any modification and informs us about that through a `UnusportedOperationException`.

```java
    public int calculateActiveReservations(List<Reservations> reservations) {
        reservations.removeIf(reservation -> reservation.getStatus() != Status.Active); // UnusportedOperationException
        return reservations.size();
    }
```

But there are few problems with standard "immutable" Java collections:
- First of all, this behavior seems more like read-only than immutable. The immutable collection should return us a copy.
- Second thing, and this applies to all runtime exceptions, they only occur during runtime. And it's usually too late.

So let's see how else we can approach the subject.

For example, In Kotlin `List` interface doesn't contain methods like `add`, `remove`, etc.
And that sounds much more reasonable than throwing `UnsupportedOperationException`.
Because we are held back by the compiler already during development stage.

```kotlin
    val immutableList: List<String> = arrayListOf("a")
    immutableList.add("b") // doesn't work, there is no method like 'add'
```

To modify a list we need to define it explicitly as `MutableList`

```kotlin
    val mutableList: MutableList<String> = arrayListOf("a")
    mutableList.add("b")
```

It's better, but not perfect. Adding elements should be allowed, but it should create a new list that contains values from the source list along with the newly added value.

But won't it be slow?
Theoretically, yes, but actually no.
The collection size is usually small, so it doesn't really matter. Additionally, we don't really have to copy all values to the new list.

Instead, when we add a value, we create a new object that contains reference to the previous one along with the new element.

```java
class ImmutableList<T> {
    private ImmutableList<T> head;
    private T tail;

    ImmutableList<T> add(T element) {
        return new ImmutableList<>(this, element);
    }
}
```

Unfortunately, such collections are not build-in Java, so we need to use external libraries like Vavr.io

### Functions
Functional programming is all about programming with functions.
Functions are:
- Total. For every input, they return an output. 
- Pure. The function return values are identical for identical arguments, and the function has no side effects.

Let's review few methods and determine if they are total and pure.

```java
class Account {
    
    private BigDecimal balance;
        
    void deposit(BigDecimal amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException();
        }
        balance += amount;
    }
}
```

> As a rule of thumb, using `void` is usually bad practice.
> Methods that return void:
> - cannot be used in method chaining. Instead of `account.map(ac -> ac.deposit(BigDecimal.of(10));`, we are forced to `account.map(ac -> {ac.deposit(BigDecimal.of(10)); return ac.getBalance();})`
> - do not provide a way to return an error. Instead, exceptions must be used for error handling.
> - are harder to write unit tests for it because you cannot assert on the return value. 
> - make it more difficult to track changes that have been made.

It's nor total nor pure.
The method returns output only if argument is greater than 0, and it modifies internal state, so depend on the current state the method may behave differently.

To make it total, we can introduce new type which allows only to provide positive BigDecimals. So now our method signature forces to use the appropriate parameter.

```java
    void deposit(PositiveBigDecimal amount) {
        balance += amount;
    }
```

Let's try to make it also pure.
What if we make this object immutable?

```java
class Account {
    
    private final BigDecimal balance;
        
    Account deposit(BigDecimal amount) {
        return new Account(balance + amount);
    }
}
```

You may say it's still not pure, because it still depends on internal state. But what if we write it down like this

```java
    static Account deposit(Account account, BigDecimal amount) {
        return new Account(account.balance() + amount);
    }
```
As you see, we can just treat our object as a first argument of our function. So the first approach is absolutely fine and can be acknowledged as pure.

Let's take a look at another example

```java
    private Map<Long, User> users = new HashMap<>();

    User getUser(long id) {
        return users.get(id);
    }
```
Is the function pure?
It's not, It can return User or null for the same argument.

How can we fix it? We can present it explicitly using a type system.
In this case `Optional` seems reasonable.

```java
    Optional<User> getUser(long id) {
        return Optional.ofNullabe(map.get(id));
    } 
```

The side effect still exists, but we encoded that fact using type system. It's not hidden like in the previous example.

In Kotlin, this is default behavior, we need to explicitly say if result of operation is nullable or not.
`?` -> nullable

```kotlin
    fun getUser(id: Long): User? = map.get(id)
```

#### Optional

For those not familiar with FP the most straightforward way to use `Optional` will be
```java
    Optional<User> userOpt = getUser(1);
    if (userOpt.isPresent()) {
        User user = userOpt.get();    
    }
```
But it's not really how we do it functionally. 
In most cases, we should avoid invoking `get()`. We want to use `map` and `flatMap`.


❌
```java
    public String displayUsername(long userId){
        Optional<User> userOpt = getUser(userId);
        if(userOpt.isPresent){
            return userOpt.get().getName();
        }
        return"Annonymous";
    }
}
```

✅
```java
    public String displayUsername(long userId) {
        return getUser(userId)
            .map(user -> user.getName())
            .orElse("Annonymous");    
    }
```

The first piece of code is not perfect, but we can live with it. Now, let's imagine `User#getUsername` returns `Optional<String>`


❌
```java
    public String displayUsername(long userId) {
        Optional<User> userOpt = getUser(userId);
        if (userOpt.isPresent) {
            usernameOpt = userOpt.get().getUsername();
            if (usernameOpt.isPresent) {
                return usernameOpt.get();
            }
        }
        return "Anonymous";
    }
```

✅
```java {3}
    public String displayUsername(long userId) {
        return getUser(userId)
            .flatMap(user -> user.getName()) 
            .orElse("Anonymous");    
    }
```

Kotlin has built-in `map` operation.
```kotlin
    fun displayUsername(userId: Long): String = 
        getUser(userId)?.username ?: "Anonymous"
```

#### Validation

The hidden behavior also applies to validation.

```java
    public User createUser(String name) {
        if (name.length < 3) {
            throw new IllegalArgumentException("Name too short");
        }
        return new User(name);
    }
```

What's the problem here?
- The method signature hides from us the fact there is validation inside method body.
- The compiler doesn't force us to handle error.
- Exceptions are not an excellent choice for business errors, they are more for **exception**al cases.

How to do it better?

```java
    public Either<DomainError, User> createUser(String name) {
        if (name.length < 3) {
            return Either.left(DomainError.NAME_TOO_SHORT);
        }
        return Either.right(new User(name));
    }
```

Either allows explicitly showing our method has two paths. The success - right, and the failure - left.
<References links={[
{ title: "Either", url: "https://eed3si9n.com/learning-scalaz/Either.html" },
]} />

Thanks to that:
- We don't need to open method code to discover alternative scenarios.
- compiler forces us to handle errors.

Another interesting class is `Validation`.
Let's write a code for loading CSV files.

```java
    List<Flight> load(List<String> lines) {
        return lines.stream().map(it -> it.parse(it)).toList();
    }
    
    private Flight parse(String line){
        var args = line.split(",");
        String departure = args[0];
        if (!isValidIcaoCode(departure)){
            throw new IllegalArgumentException("Departure is not valid icao airport code.");
        }
        String destination = args[1];
        if (!isValidIcaoCode(destination)){
            throw new IllegalArgumentException("Desination is not valid icao airport code.");
        }
    }
    
    private boolean isValidIcaoCode(String icaoCode){
        return icao.length() == 4;
    }
```

And let's image we want to upload CSV with hundreds rows and some of them contain errors. Do you see a problem with above solution?
If there are errors in our CSV file we won't be informed about all errors at once, but only **first** encountered error.
In this case a list of errors would be more handful. For that purpose, we can use `Validation` from Vavr.
Like `Either`, `Validation` contains two paths, valid and invalid. The main difference is that instead of chaining the result from the first event to the next, `Validation` validates all events.
<References links={[
{ title: "Validation", url: "https://eed3si9n.com/learning-scalaz/Validation.html" },
]} />

```java
   public List<Validation<Seq<String>, Flight> load(List<String> lines) {
        return lines.map(this::parse);
    }

    private Validation<Seq<String>, Flight> parse(String line) {
        var args = line.split(",");
        String departure = args[0];
        String destination = args[1];
        return Validation.combine(
                validateIcaoCode(departure),
                validateIcaoCode(destination)
        ).ap(Flight::new);
    }

    private Validation<String, String> validateIcaoCode(String icao) {
        if (icao.length() == 4) {
            return Validation.valid(icao);
        }
        return Validation.invalid("%s is not valid ICAO code".formatted(icao));
    }
```

Our code didn't change much. Instead of throwing an exception, we just return an object, so the flow is not terminated instantly.
The load part is more problematic because we have to handle `List<Validation<Seq<String>, Flight>>`. The question is how to aggregate the data to easily display the number of loaded flights or the list of validation errors.
For sake of humanity there is `Validation#sequence` which:

> Reduces many Validation instances into a single Validation by transforming an `Iterable<Validation<? extends T>>` into a `Validation<Seq<T>>`.

```java
    Validation<Seq<String>, Seq<Flight>> result = Validation.sequence(load(input));
    String message = result
        .fold(
                strings -> strings.mkString("Failed to load flights: \n", "\n", ""),
                flights -> "Successfully loaded " + flights.size() + " flights."
        );
```

Thanks to transforming to single `Validation` we can easily tell if the whole operation succeed or not. We utilize `<U> U fold(Function<? super E, ? extends U> ifInvalid, Function<? super T, ? extends U> ifValid)` to map errors and flights to the same type.

## Summary
We've only touched the basics. There is much more in the world of Functional Programming, but Java doesn't have decent support for that. 
However, that's not the only problem. Functional code may be incomprehensible for those not familiar with crucial concepts.
TU MOZE JAKIS PRZYKLAD MALO ZROZUMIALEGO KODU
I TU FAKTYCZNE PODSUWAMOWANIE TEGO CO BYLO

So in Java, I would stick to the basics; otherwise, your colleagues might hate you. 
Just for curiosity's sake, we can take a look at Higher-Kinded Types, which I found very interesting years ago because it was something I wanted to use in my Java project.
However, I wasn't aware of it at the time, and later discovered that Java doesn't really support this concept anyway.

Let's imagine we want to have code that allows us to load flight data.
```java
interface FlightLoader {

    Flight load(UUID gufi);
} 
```
And let's say we will get the flight data from some external source.
```java
class ExternalFlightLoader implements FlightLoader {
    
    @Override
    public Flight load(UUID gufi) {
        // http request or something
        return new Flight();
    }
}
```
Awesome, and then we want to have an implementation which allows us to retrieve flights from memory.
```java
class InMemoryFlightLoader implements FlightLoader {

    private final Map<UUID, Flight> flights;

    @Override
    public Flight load(UUID gufi) {
        return flights.get(gufi);
    }
}
```

Okay, but what if we want to change our `ExternalFlightLoader` implementation to load flights asynchronously.
```java
class ExternalFlightLoader implements FlightLoader {

    @Override
    public CompletableFuture<Flight> load(UUID gufi) {
        return CompletableFuture.supplyOf(() -> {
            // http request
            return new Flight();
        });
    }
}
```
But that will affect the method signature change in our interface as well.
```java
interface FlightLoader {

    CompletableFuture<Flight> load(UUID gufi);
}
```
What will cause also change in our in memory implementation.
```java
class InMemoryFlightLoader implements FlightLoader {

    private final Map<UUID, Flight> flights;

    @Override
    public CompletableFuture<Flight> load(UUID gufi) {
        return CompletableFuture.completedFuture(flights.get(gufi));
    }
}
```
Which seems like nonsense to me, because why the heck we should wrap non-asynchronous code in CompletableFuture. 
And that's the place where we can apply HKT. But it's not really a thing in Java, so we will switch to Scala for example purposes.
```scala
trait FlightLoader[F[_]] {
  
  def load(gufi: UUID): F[Flight]
}
```
As you can guess, we can wrap our method in a generic type. 
```scala
class ExternalFlightLoader extends FlightLoader[CompletableFuture] {
  
  def load(gufi: UUID): CompletableFuture[Flight]
}

class InMemoryFlightLoader extends FlightLoader[Option] {
  
  def load(gufi: UUID): Option[Flight]
}
```
Functional Programming offers us much more, but as Java developers, we can't really apply more advanced concepts to our projects. So, we have to decide if we want to complain about the missing features or live in blissful ignorance.
However, looking at Java development, we can observe that it has a tendency to draw from functional programming languages, incorporating features such as immutable structures, ~~immutable~~ readonly collections, pattern matching, etc. 
